import { Request } from 'express';

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── GST ─────────────────────────────────────────────────────────────────────

export interface B2BInvoice {
  buyerGstin: string;
  buyerName: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface B2CInvoice {
  stateCode: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  rate: number;
}

export interface HsnSummary {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface Gstr1Data {
  gstin: string;
  period: string;
  b2b: B2BInvoice[];
  b2c: B2CInvoice[];
  hsn: HsnSummary[];
  amendments: unknown[];
  totalTaxableValue?: number;
  totalTax?: number;
}

export interface Gstr3bData {
  gstin: string;
  period: string;
  outwardSupplies: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  interestateSupplies: {
    unreg: number;
    comp: number;
    uin: number;
  };
  itcEligible: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  itcReversed: {
    rule42: number;
    rule43: number;
    others: number;
  };
  exemptNonGst: {
    interState: number;
    intraState: number;
  };
  taxPayable?: number;
  taxPaid?: number;
}

// ─── ITR ─────────────────────────────────────────────────────────────────────

export interface SalaryIncome {
  employerName: string;
  employerTan: string;
  grossSalary: number;
  hra: number;
  lta: number;
  otherAllowances: number;
  standardDeduction: number;
  netSalary: number;
}

export interface HousePropertyIncome {
  address: string;
  annualRent: number;
  municipalTax: number;
  netAnnualValue: number;
  standardDeduction30: number;
  interestOnLoan: number;
  netIncome: number;
}

export interface CapitalGain {
  assetType: string;
  saleDate: string;
  purchaseDate: string;
  saleConsideration: number;
  costOfAcquisition: number;
  indexedCost?: number;
  gain: number;
  type: 'STCG' | 'LTCG';
}

export interface Deductions {
  section80C: number;   // LIC, PPF, ELSS, etc.
  section80CCC: number; // Pension fund
  section80D: number;   // Medical insurance
  section80G: number;   // Donations
  section80TTA: number; // Savings interest
  section80EE: number;  // Home loan interest
  total?: number;
}

export interface TaxComputation {
  grossTotalIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  taxOldRegime: number;
  taxNewRegime: number;
  surcharge: number;
  cess: number;
  totalTaxLiability: number;
  tdsDeducted: number;
  advanceTax: number;
  selfAssessmentTax: number;
  refund?: number;
  balanceDue?: number;
  regime: 'OLD' | 'NEW';
}

export interface Itr1Data {
  pan: string;
  assessmentYear: string;
  name: string;
  dob: string;
  aadhaar?: string;
  residentialStatus: 'ROR' | 'NOR' | 'NR';
  salary: SalaryIncome[];
  houseProperty: HousePropertyIncome[];
  otherIncome: number;
  deductions: Deductions;
  taxComputation?: TaxComputation;
}

export interface Itr2Data extends Itr1Data {
  capitalGains: CapitalGain[];
  foreignIncome: number;
  assets: {
    immovableProperty: number;
    movableProperty: number;
    financialAssets: number;
    liabilities: number;
  };
}

// ─── VAULTIQ ──────────────────────────────────────────────────────────────────

export interface VaultClientInput {
  name: string;
  gstin?: string;
  cin?: string;
  pan?: string;
  industry: string;
  employees: number;
  jurisdiction: string;
  website?: string;
  engagementStart?: string;
  engagementEnd?: string;
  services: string[];
}

export interface DataAssetInput {
  vaultClientId: string;
  name: string;
  service: string;
  categories: string[];
  owner: string;
}

export interface RiskProfile {
  riskScore: number;
  riskBand: 'Low' | 'Medium' | 'High';
  dataCategories: string[];
  sdpCount: number;
  obligations: string[];
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AiChatRequest {
  message: string;
  module?: 'general' | 'gst' | 'itr' | 'vaultiq';
  conversationId?: string;
}

export interface AiChatResponse {
  reply: string;
  conversationId: string;
  title?: string;
}
