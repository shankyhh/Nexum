import { AppError } from '../middleware/errorHandler';
import { Itr1Data, Itr2Data, TaxComputation, PaginationQuery } from '../types';
import { prisma } from '../prisma';

// ─── Tax slabs AY 2025-26 ────────────────────────────────────────────────────

function calcOldRegimeTax(income: number): number {
  if (income <= 250000) return 0;
  if (income <= 500000) return (income - 250000) * 0.05;
  if (income <= 1000000) return 12500 + (income - 500000) * 0.2;
  return 12500 + 100000 + (income - 1000000) * 0.3;
}

function calcNewRegimeTax(income: number): number {
  // New regime slabs (AY 2025-26)
  if (income <= 300000) return 0;
  if (income <= 700000) return (income - 300000) * 0.05;
  if (income <= 1000000) return 20000 + (income - 700000) * 0.1;
  if (income <= 1200000) return 50000 + (income - 1000000) * 0.15;
  if (income <= 1500000) return 80000 + (income - 1200000) * 0.2;
  return 140000 + (income - 1500000) * 0.3;
}

function surchargeRate(income: number): number {
  if (income > 50000000) return 0.37;
  if (income > 20000000) return 0.25;
  if (income > 10000000) return 0.15;
  if (income > 5000000) return 0.1;
  return 0;
}

export function computeTax(data: Itr1Data | Itr2Data): TaxComputation {
  // Gross total income
  const salaryIncome = (data.salary || []).reduce((s, i) => s + (i.netSalary || 0), 0);
  const hpIncome = (data.houseProperty || []).reduce((s, i) => s + (i.netIncome || 0), 0);
  const cgIncome =
    'capitalGains' in data
      ? (data.capitalGains || []).reduce((s, g) => s + (g.gain || 0), 0)
      : 0;
  const otherIncome = data.otherIncome || 0;
  const foreignIncome = 'foreignIncome' in data ? (data.foreignIncome || 0) : 0;

  const grossTotalIncome = salaryIncome + hpIncome + cgIncome + otherIncome + foreignIncome;

  // Deductions (old regime only, capped at ₹1.5L for 80C)
  const d = data.deductions || ({} as typeof data.deductions);
  const total80C = Math.min(d.section80C || 0, 150000);
  const total80D = Math.min(d.section80D || 0, 25000);
  const total80G = d.section80G || 0;
  const total80TTA = Math.min(d.section80TTA || 0, 10000);
  const total80EE = Math.min(d.section80EE || 0, 50000);
  const totalDeductions = total80C + total80D + total80G + total80TTA + total80EE +
    (d.section80CCC || 0);

  // Old regime
  const netIncomeOld = Math.max(0, grossTotalIncome - totalDeductions);
  let taxOld = calcOldRegimeTax(netIncomeOld);
  // Section 87A rebate (up to ₹12,500 if income ≤ ₹5L)
  if (netIncomeOld <= 500000) taxOld = Math.max(0, taxOld - 12500);

  // New regime
  const netIncomeNew = Math.max(0, grossTotalIncome - 75000); // standard deduction
  let taxNew = calcNewRegimeTax(netIncomeNew);
  // Section 87A rebate (up to ₹25,000 if income ≤ ₹7L in new regime)
  if (netIncomeNew <= 700000) taxNew = Math.max(0, taxNew - 25000);

  // Use the better regime by default (lower tax)
  const regime = taxNew <= taxOld ? 'NEW' : 'OLD';
  const baseTax = regime === 'NEW' ? taxNew : taxOld;
  const netIncome = regime === 'NEW' ? netIncomeNew : netIncomeOld;

  const surcharge = baseTax * surchargeRate(netIncome);
  const taxAfterSurcharge = baseTax + surcharge;
  const cess = taxAfterSurcharge * 0.04; // 4% Health & Education Cess
  const totalTax = Math.round((taxAfterSurcharge + cess) * 100) / 100;

  return {
    grossTotalIncome: Math.round(grossTotalIncome * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netTaxableIncome: Math.round(netIncome * 100) / 100,
    taxOldRegime: Math.round((calcOldRegimeTax(Math.max(0, grossTotalIncome - totalDeductions))) * 100) / 100,
    taxNewRegime: Math.round(taxNew * 100) / 100,
    surcharge: Math.round(surcharge * 100) / 100,
    cess: Math.round(cess * 100) / 100,
    totalTaxLiability: totalTax,
    tdsDeducted: 0,
    advanceTax: 0,
    selfAssessmentTax: 0,
    regime,
  };
}

export const itrService = {
  async createReturn(userId: string, body: { pan: string; assessmentYear: string; returnType: string; data: unknown }) {
    return prisma.itrReturn.create({
      data: {
        userId,
        pan: body.pan,
        assessmentYear: body.assessmentYear,
        returnType: body.returnType,
        status: 'DRAFT',
        data: body.data as object || {},
      },
    });
  },

  async updateReturn(id: string, userId: string, data: unknown) {
    const existing = await prisma.itrReturn.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError('Return not found.', 404);
    if (existing.status === 'FILED') throw new AppError('Filed returns cannot be edited.', 400);

    return prisma.itrReturn.update({ where: { id }, data: { data: data as object } });
  },

  async fileReturn(id: string, userId: string) {
    const existing = await prisma.itrReturn.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError('Return not found.', 404);
    if (existing.status === 'FILED') throw new AppError('Return already filed.', 400);

    return prisma.itrReturn.update({
      where: { id },
      data: { status: 'FILED', filedAt: new Date() },
    });
  },

  async getReturns(userId: string, query: PaginationQuery & { returnType?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (query.status) where.status = query.status;
    if (query.returnType) where.returnType = query.returnType;

    const [total, items] = await Promise.all([
      prisma.itrReturn.count({ where }),
      prisma.itrReturn.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getReturnById(id: string, userId: string) {
    const ret = await prisma.itrReturn.findFirst({ where: { id, userId } });
    if (!ret) throw new AppError('Return not found.', 404);
    return ret;
  },

  calculateTax(data: Itr1Data | Itr2Data) {
    return computeTax(data);
  },

  async getSummary(userId: string) {
    const [total, filed, pending, draft] = await Promise.all([
      prisma.itrReturn.count({ where: { userId } }),
      prisma.itrReturn.count({ where: { userId, status: 'FILED' } }),
      prisma.itrReturn.count({ where: { userId, status: 'PENDING' } }),
      prisma.itrReturn.count({ where: { userId, status: 'DRAFT' } }),
    ]);
    const recent = await prisma.itrReturn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { total, filed, pending, draft, recent };
  },
};
