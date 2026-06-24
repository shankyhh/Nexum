import { AppError } from '../middleware/errorHandler';
import { Gstr1Data, Gstr3bData, PaginationQuery } from '../types';
import { prisma } from '../prisma';

function calcGstr1Tax(data: Gstr1Data) {
  let totalTaxable = 0, totalIgst = 0, totalCgst = 0, totalSgst = 0, totalCess = 0;
  [...(data.b2b || []), ...(data.b2c || [])].forEach((inv) => {
    totalTaxable += inv.taxableValue || 0;
    totalIgst += inv.igst || 0;
    totalCgst += inv.cgst || 0;
    totalSgst += inv.sgst || 0;
    totalCess += inv.cess || 0;
  });
  return {
    totalTaxableValue: Math.round(totalTaxable * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalCess: Math.round(totalCess * 100) / 100,
    totalTax: Math.round((totalIgst + totalCgst + totalSgst + totalCess) * 100) / 100,
  };
}

function calcGstr3bLiability(data: Gstr3bData) {
  const os = data.outwardSupplies || {};
  const itcE = data.itcEligible || {};
  const itcR = data.itcReversed || {};

  const totalLiability =
    (os.igst || 0) + (os.cgst || 0) + (os.sgst || 0) + (os.cess || 0);
  const itcAvailable =
    (itcE.igst || 0) + (itcE.cgst || 0) + (itcE.sgst || 0) + (itcE.cess || 0);
  const itcReversed =
    (itcR.rule42 || 0) + (itcR.rule43 || 0) + (itcR.others || 0);
  const netItc = Math.max(0, itcAvailable - itcReversed);
  const taxPayable = Math.max(0, Math.round((totalLiability - netItc) * 100) / 100);

  return { totalLiability, itcAvailable, itcReversed, netItc, taxPayable };
}

export const gstService = {
  async createReturn(userId: string, body: { gstin: string; period: string; returnType: string; data: unknown }) {
    const ret = await prisma.gstReturn.create({
      data: {
        userId,
        gstin: body.gstin,
        period: body.period,
        returnType: body.returnType,
        status: 'DRAFT',
        data: body.data as object || {},
      },
    });
    return ret;
  },

  async updateReturn(id: string, userId: string, data: unknown) {
    const existing = await prisma.gstReturn.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError('Return not found.', 404);
    if (existing.status === 'FILED') throw new AppError('Filed returns cannot be edited.', 400);

    return prisma.gstReturn.update({
      where: { id },
      data: { data: data as object, updatedAt: new Date() },
    });
  },

  async fileReturn(id: string, userId: string) {
    const existing = await prisma.gstReturn.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError('Return not found.', 404);
    if (existing.status === 'FILED') throw new AppError('Return already filed.', 400);

    return prisma.gstReturn.update({
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
      prisma.gstReturn.count({ where }),
      prisma.gstReturn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getReturnById(id: string, userId: string) {
    const ret = await prisma.gstReturn.findFirst({ where: { id, userId } });
    if (!ret) throw new AppError('Return not found.', 404);
    return ret;
  },

  calculateGstr1Tax(data: Gstr1Data) {
    return calcGstr1Tax(data);
  },

  calculateGstr3bLiability(data: Gstr3bData) {
    return calcGstr3bLiability(data);
  },

  async getSummary(userId: string) {
    const [total, filed, pending, draft] = await Promise.all([
      prisma.gstReturn.count({ where: { userId } }),
      prisma.gstReturn.count({ where: { userId, status: 'FILED' } }),
      prisma.gstReturn.count({ where: { userId, status: 'PENDING' } }),
      prisma.gstReturn.count({ where: { userId, status: 'DRAFT' } }),
    ]);

    const recent = await prisma.gstReturn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return { total, filed, pending, draft, recent };
  },
};
