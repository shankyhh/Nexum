import { AppError } from '../middleware/errorHandler';
import { VaultClientInput, DataAssetInput, RiskProfile } from '../types';
import { prisma } from '../prisma';

// ─── Data category dictionary ──────────────────────────────────────────────

const DATA_CATS: Record<string, { label: string; sens: number; sdp: boolean; cls: string }> = {
  PAN:           { label: 'PAN', sens: 7, sdp: false, cls: 'Confidential' },
  Aadhaar:       { label: 'Aadhaar', sens: 10, sdp: true, cls: 'Highly Restricted' },
  Passport:      { label: 'Passport', sens: 9, sdp: true, cls: 'Highly Restricted' },
  BankDetails:   { label: 'Bank Details', sens: 8, sdp: false, cls: 'Restricted' },
  SalaryData:    { label: 'Salary / Payroll', sens: 7, sdp: false, cls: 'Restricted' },
  Medical:       { label: 'Medical / Health', sens: 10, sdp: true, cls: 'Highly Restricted' },
  DirectorInfo:  { label: 'Director Information', sens: 5, sdp: false, cls: 'Confidential' },
  Shareholder:   { label: 'Shareholder Data', sens: 5, sdp: false, cls: 'Confidential' },
  CustomerData:  { label: 'Customer Data', sens: 6, sdp: false, cls: 'Confidential' },
  VendorInfo:    { label: 'Vendor Information', sens: 4, sdp: false, cls: 'Internal' },
  EmployeePII:   { label: 'Employee PII', sens: 7, sdp: false, cls: 'Restricted' },
  Financials:    { label: 'Financial Statements', sens: 5, sdp: false, cls: 'Confidential' },
  Contracts:     { label: 'Contracts / Agreements', sens: 4, sdp: false, cls: 'Confidential' },
  BiometricPhoto:{ label: 'Photographs / Biometric', sens: 8, sdp: true, cls: 'Highly Restricted' },
  Corporate:     { label: 'Corporate Records', sens: 3, sdp: false, cls: 'Internal' },
};

const SERVICES_DEF: Record<string, { risk: string; required: string[]; optional: string[]; dpdp: string }> = {
  'Statutory Audit': { risk: 'Medium', required: ['Financials','Contracts','BankDetails','DirectorInfo'], optional: ['VendorInfo','CustomerData'], dpdp: 'Lawful basis: contractual + statutory mandate.' },
  'Internal Audit':  { risk: 'Medium', required: ['Financials','VendorInfo','Contracts'], optional: ['EmployeePII','CustomerData'], dpdp: 'Access on need-to-know basis.' },
  'Tax Audit':       { risk: 'Medium', required: ['Financials','PAN','BankDetails','Contracts'], optional: ['VendorInfo'], dpdp: 'PAN for statutory linkage only.' },
  'GST Compliance':  { risk: 'Medium', required: ['Financials','PAN','VendorInfo','Contracts'], optional: ['CustomerData'], dpdp: 'Vendor/customer PAN is a business identifier.' },
  'Payroll':         { risk: 'High', required: ['PAN','BankDetails','SalaryData','EmployeePII'], optional: ['Aadhaar'], dpdp: 'High-volume employee PII. Issue DPDP notice.' },
  'Secretarial Compliance': { risk: 'Low', required: ['DirectorInfo','Shareholder','Corporate'], optional: ['Contracts'], dpdp: 'Director data is largely public-record.' },
  'Virtual CFO':     { risk: 'Medium', required: ['Financials','BankDetails','Contracts','VendorInfo'], optional: ['SalaryData','CustomerData'], dpdp: 'Enforce role-based controls.' },
  'Due Diligence':   { risk: 'High', required: ['Financials','Contracts','DirectorInfo','Shareholder','BankDetails'], optional: ['EmployeePII','CustomerData','VendorInfo'], dpdp: 'Time-boxed data room; auto-delete on closure.' },
  'M&A':             { risk: 'High', required: ['Financials','Contracts','Shareholder','DirectorInfo'], optional: ['EmployeePII','CustomerData'], dpdp: 'Cross-party sharing — execute DPAs/NDAs.' },
  'Litigation Support': { risk: 'High', required: ['Financials','Contracts','PAN','Corporate'], optional: ['BankDetails','VendorInfo'], dpdp: 'Legal-proceedings exemption may apply.' },
  'FEMA Advisory':   { risk: 'Medium', required: ['Financials','Contracts','DirectorInfo','BankDetails'], optional: ['Shareholder','Passport'], dpdp: 'Passport only for non-resident KYC.' },
  'Transfer Pricing':{ risk: 'Medium', required: ['Financials','Contracts','Corporate'], optional: ['VendorInfo','CustomerData'], dpdp: 'Minimise individual PII.' },
  'Other':           { risk: 'Medium', required: ['Financials','Contracts'], optional: ['PAN','BankDetails'], dpdp: 'Scope to documented engagement purpose.' },
};

const INDUSTRY_RISK: Record<string, number> = {
  Manufacturing: 1, Technology: 2, 'Financial Services': 3, Healthcare: 3,
  Retail: 1, 'Real Estate': 2, Pharma: 3, Logistics: 1, 'E-commerce': 2, Education: 1, Other: 1,
};

const DPDP_REGISTERS = ['notice','purpose','sharing','retention','deletion','access','vendor','consent'];

const RETENTION_RULES: Record<string, { trigger: string; period: string; action: string }> = {
  SalaryData:  { trigger: 'Employee exit / FY close', period: '8 years', action: 'Retain' },
  EmployeePII: { trigger: 'Employee exit', period: 'Exit + 3 years', action: 'Review' },
  PAN:         { trigger: 'Engagement closure', period: '6 years', action: 'Retain' },
  Aadhaar:     { trigger: 'Statutory purpose complete', period: 'Delete immediately after use', action: 'Delete' },
  Passport:    { trigger: 'KYC complete', period: 'Delete after verification', action: 'Delete' },
  BankDetails: { trigger: 'Engagement closure', period: '6 years', action: 'Retain' },
  Financials:  { trigger: 'FY close', period: '8 years', action: 'Retain' },
  Contracts:   { trigger: 'Contract end', period: 'End + 7 years', action: 'Retain' },
  Medical:     { trigger: 'Purpose complete', period: 'Delete immediately', action: 'Delete' },
  VendorInfo:  { trigger: 'Engagement closure', period: 'Closure + 3 years', action: 'Archive' },
  CustomerData:{ trigger: 'Engagement closure', period: 'Closure + 3 years', action: 'Review' },
  DirectorInfo:{ trigger: 'Filing complete', period: '8 years', action: 'Retain' },
  Shareholder: { trigger: 'Filing complete', period: '8 years', action: 'Retain' },
  Corporate:   { trigger: 'Engagement closure', period: 'Closure + 3 years', action: 'Archive' },
  BiometricPhoto: { trigger: 'Purpose complete', period: 'Delete immediately', action: 'Delete' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferRisk(services: string[], industry: string, employees: number): RiskProfile {
  const cats = new Set<string>();
  const riskWord: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
  let maxRisk = 0;

  services.forEach((s) => {
    const def = SERVICES_DEF[s];
    if (!def) return;
    def.required.forEach((c) => cats.add(c));
    def.optional.forEach((c) => cats.add(c));
    maxRisk = Math.max(maxRisk, riskWord[def.risk] || 1);
  });

  const catArr = [...cats];
  const sdpCount = catArr.filter((c) => DATA_CATS[c]?.sdp).length;
  const avgSens =
    catArr.length ? catArr.reduce((a, c) => a + (DATA_CATS[c]?.sens || 4), 0) / catArr.length : 4;

  let score = avgSens * 7 + sdpCount * 6 + (INDUSTRY_RISK[industry] || 1) * 4 + maxRisk * 5;
  if (employees > 200) score += 6;
  score = Math.min(100, Math.round(score));

  const riskBand: 'Low' | 'Medium' | 'High' = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';

  const obligations = [
    'Issue DPDP §5 notice to data principals before/at collection',
    'Maintain Purpose & Processing register (accountability §8)',
    'Apply data minimisation — collect only listed required documents',
  ];
  if (catArr.some((c) => DATA_CATS[c]?.sdp))
    obligations.push('Heightened safeguards for sensitive identifiers (Aadhaar/Passport/Health)');
  obligations.push('Define retention triggers & scheduled deletion (§8(7) storage limitation)');
  obligations.push('Log every disclosure in Data Sharing register');
  if (riskBand === 'High')
    obligations.push('Quarterly access review + DPA with every sub-processor/vendor');

  return { riskScore: score, riskBand, dataCategories: catArr, sdpCount, obligations };
}

function classifyDocument(fileName: string, cats: string[]) {
  const name = fileName.toLowerCase();
  const set = new Set(cats);
  const sig: [string, string][] = [
    ['aadhaar', 'Aadhaar'], ['uid', 'Aadhaar'], ['passport', 'Passport'], ['pan', 'PAN'],
    ['salary', 'SalaryData'], ['payslip', 'SalaryData'], ['payroll', 'SalaryData'],
    ['bank', 'BankDetails'], ['medical', 'Medical'], ['health', 'Medical'],
    ['director', 'DirectorInfo'], ['share', 'Shareholder'], ['customer', 'CustomerData'],
    ['vendor', 'VendorInfo'], ['invoice', 'VendorInfo'], ['photo', 'BiometricPhoto'],
    ['gst', 'Financials'], ['balance', 'Financials'], ['p&l', 'Financials'],
    ['contract', 'Contracts'], ['agreement', 'Contracts'],
  ];
  sig.forEach(([k, c]) => { if (name.includes(k)) set.add(c); });
  if (set.size === 0) set.add('Corporate');

  const arr = [...set];
  const sensitivity = Math.max(...arr.map((c) => DATA_CATS[c]?.sens || 3));
  const classOrder = ['Public','Internal','Confidential','Restricted','Highly Restricted'];
  const classification = arr
    .map((c) => DATA_CATS[c]?.cls || 'Internal')
    .sort((a, b) => classOrder.indexOf(b) - classOrder.indexOf(a))[0];

  const riskScore = Math.min(100, sensitivity * 9 + (arr.some((c) => DATA_CATS[c]?.sdp) ? 15 : 0));
  const isSdp = arr.some((c) => DATA_CATS[c]?.sdp);

  const storageFolder = arr.includes('SalaryData') ? '03 Payroll'
    : arr.some((c) => ['Aadhaar','Passport','BiometricPhoto'].includes(c)) ? '02 Client KYC (locked)'
    : arr.includes('VendorInfo') ? '06 Vendor Documents'
    : arr.includes('Contracts') ? '01/05 Working Papers' : '04 GST & Tax';

  const sharingPolicy =
    classification === 'Highly Restricted' ? 'Block external; partner approval for internal share'
    : classification === 'Restricted' ? 'Approval required; mask identifiers before sharing'
    : 'Need-to-know internal sharing';

  const retentionRule = RETENTION_RULES[arr[0]] || { trigger: 'Engagement closure', period: 'Closure + 3 years', action: 'Review' };

  return { categories: arr, classification, riskScore, sensitivity, isSdp, storageFolder, sharingPolicy, retentionRule };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const vaultiqService = {
  inferRisk,
  classifyDocument,

  async createClient(userId: string, input: VaultClientInput) {
    const profile = inferRisk(input.services, input.industry, input.employees);

    const client = await prisma.vaultClient.create({
      data: {
        userId,
        name: input.name,
        gstin: input.gstin,
        cin: input.cin,
        pan: input.pan,
        industry: input.industry,
        employees: input.employees,
        jurisdiction: input.jurisdiction,
        website: input.website,
        engagementStart: input.engagementStart ? new Date(input.engagementStart) : undefined,
        engagementEnd: input.engagementEnd ? new Date(input.engagementEnd) : undefined,
        services: input.services,
        riskScore: profile.riskScore,
        riskBand: profile.riskBand,
        dataCategories: profile.dataCategories,
      },
    });

    // Auto-create DPDP registers
    await prisma.dpdpRegister.createMany({
      data: DPDP_REGISTERS.map((r) => ({
        vaultClientId: client.id,
        registerType: r,
        status: 'GAP' as const,
      })),
    });

    return { ...client, profile };
  },

  async getClients(userId: string) {
    const clients = await prisma.vaultClient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { dataAssets: true, sharingLogs: true } },
        dpdpRegisters: true,
      },
    });

    return clients.map((c) => {
      const activeRegisters = c.dpdpRegisters.filter((r) => r.status === 'ACTIVE').length;
      const dpdpScore = Math.round((activeRegisters / DPDP_REGISTERS.length) * 100);
      return { ...c, dpdpScore };
    });
  },

  async getClientById(id: string, userId: string) {
    const client = await prisma.vaultClient.findFirst({
      where: { id, userId },
      include: {
        dataAssets: { orderBy: { createdAt: 'desc' } },
        sharingLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        dpdpRegisters: true,
      },
    });
    if (!client) throw new AppError('Client not found.', 404);

    const activeRegisters = client.dpdpRegisters.filter((r) => r.status === 'ACTIVE').length;
    const dpdpScore = Math.round((activeRegisters / DPDP_REGISTERS.length) * 100);
    const dpdpGaps = client.dpdpRegisters.filter((r) => r.status === 'GAP').map((r) => r.registerType);

    return { ...client, dpdpScore, dpdpGaps };
  },

  async updateClientStatus(id: string, userId: string, status: string) {
    const existing = await prisma.vaultClient.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError('Client not found.', 404);
    return prisma.vaultClient.update({ where: { id }, data: { status: status as 'ACTIVE' | 'CLOSING' | 'CLOSED' } });
  },

  async createDataAsset(input: DataAssetInput) {
    const cl = classifyDocument(input.name, input.categories);
    return prisma.dataAsset.create({
      data: {
        vaultClientId: input.vaultClientId,
        name: input.name,
        service: input.service,
        categories: cl.categories,
        classification: cl.classification,
        riskScore: cl.riskScore,
        sensitivity: cl.sensitivity,
        isSdp: cl.isSdp,
        storageFolder: cl.storageFolder,
        sharingPolicy: cl.sharingPolicy,
        retentionTrigger: cl.retentionRule.trigger,
        retentionAction: cl.retentionRule.action,
        owner: input.owner,
        disposal: 'Active',
      },
    });
  },

  async getAssets(filters: { vaultClientId?: string; classification?: string; disposal?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.vaultClientId) where.vaultClientId = filters.vaultClientId;
    if (filters.classification) where.classification = filters.classification;
    if (filters.disposal) where.disposal = filters.disposal;

    return prisma.dataAsset.findMany({
      where,
      orderBy: { riskScore: 'desc' },
      include: { vaultClient: { select: { name: true } } },
    });
  },

  async createSharingLog(data: {
    dataAssetId: string;
    vaultClientId: string;
    sharedBy: string;
    sharedWith: string;
    purpose: string;
    expiryDate?: string;
  }) {
    return prisma.sharingLog.create({
      data: {
        dataAssetId: data.dataAssetId,
        vaultClientId: data.vaultClientId,
        sharedBy: data.sharedBy,
        sharedWith: data.sharedWith,
        purpose: data.purpose,
        approval: 'PENDING',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  },

  async getSharingLogs(filters: { vaultClientId?: string; approval?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.vaultClientId) where.vaultClientId = filters.vaultClientId;
    if (filters.approval) where.approval = filters.approval;

    return prisma.sharingLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        dataAsset: { select: { name: true, classification: true } },
        vaultClient: { select: { name: true } },
      },
    });
  },

  async updateSharingLogApproval(id: string, approval: 'GRANTED' | 'DENIED') {
    return prisma.sharingLog.update({ where: { id }, data: { approval } });
  },

  async updateDpdpRegister(vaultClientId: string, registerType: string, status: string, notes?: string) {
    return prisma.dpdpRegister.upsert({
      where: { vaultClientId_registerType: { vaultClientId, registerType } },
      update: { status: status as 'ACTIVE' | 'GAP' | 'NA', notes },
      create: { vaultClientId, registerType, status: status as 'ACTIVE' | 'GAP' | 'NA', notes },
    });
  },

  async getDpdpReadiness(vaultClientId: string) {
    const registers = await prisma.dpdpRegister.findMany({ where: { vaultClientId } });
    const weights: Record<string, number> = {
      notice: 18, purpose: 14, sharing: 14, retention: 16,
      deletion: 14, access: 10, vendor: 8, consent: 6,
    };
    let score = 0, total = 0;
    const gaps: string[] = [];
    for (const k in weights) {
      total += weights[k];
      const reg = registers.find((r) => r.registerType === k);
      if (reg?.status === 'ACTIVE') score += weights[k];
      else gaps.push(k);
    }
    return { score: Math.round((score / total) * 100), gaps, registers };
  },

  async getRetentionItems() {
    return prisma.dataAsset.findMany({
      where: { disposal: { in: ['Review', 'Delete'] } },
      include: { vaultClient: { select: { name: true, status: true } } },
      orderBy: { riskScore: 'desc' },
    });
  },

  async getDashboardStats(userId: string) {
    const [activeClients, closingClients, totalAssets, highRiskAssets, pendingApprovals, pendingRetention] =
      await Promise.all([
        prisma.vaultClient.count({ where: { userId, status: 'ACTIVE' } }),
        prisma.vaultClient.count({ where: { userId, status: 'CLOSING' } }),
        prisma.dataAsset.count({ where: { vaultClient: { userId } } }),
        prisma.dataAsset.count({ where: { vaultClient: { userId }, riskScore: { gte: 70 } } }),
        prisma.sharingLog.count({ where: { vaultClient: { userId }, approval: 'PENDING' } }),
        prisma.dataAsset.count({ where: { vaultClient: { userId }, disposal: { in: ['Review','Delete'] } } }),
      ]);

    return { activeClients, closingClients, totalAssets, highRiskAssets, pendingApprovals, pendingRetention };
  },
};
