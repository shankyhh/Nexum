// ─── Auth ───────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'CA' | 'TAXPAYER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  gstin?: string;
  pan?: string;
  phone?: string;
  createdAt: string;
}

// ─── Returns ─────────────────────────────────────────────────────────────────

export type ReturnStatus = 'DRAFT' | 'PENDING' | 'FILED' | 'REJECTED';

export interface GstReturn {
  id: string;
  gstin: string;
  period: string;
  returnType: string;
  status: ReturnStatus;
  data: Record<string, unknown>;
  filedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItrReturn {
  id: string;
  pan: string;
  assessmentYear: string;
  returnType: string;
  status: ReturnStatus;
  data: Record<string, unknown>;
  filedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── VAULTIQ ──────────────────────────────────────────────────────────────────

export type ClientStatus = 'ACTIVE' | 'CLOSING' | 'CLOSED';
export type RiskBand = 'Low' | 'Medium' | 'High';
export type Classification = 'Public' | 'Internal' | 'Confidential' | 'Restricted' | 'Highly Restricted';

export interface VaultClient {
  id: string;
  name: string;
  gstin?: string;
  cin?: string;
  pan?: string;
  industry: string;
  employees: number;
  jurisdiction: string;
  website?: string;
  status: ClientStatus;
  services: string[];
  riskScore: number;
  riskBand: RiskBand;
  dataCategories: string[];
  dpdpScore?: number;
  dpdpGaps?: string[];
  createdAt: string;
  _count?: { dataAssets: number; sharingLogs: number };
}

export interface DataAsset {
  id: string;
  vaultClientId: string;
  name: string;
  service: string;
  categories: string[];
  classification: Classification;
  riskScore: number;
  sensitivity: number;
  isSdp: boolean;
  storageFolder: string;
  sharingPolicy: string;
  retentionTrigger: string;
  retentionAction: string;
  owner: string;
  uploadDate: string;
  disposal: string;
  createdAt: string;
  vaultClient?: { name: string };
}

export interface SharingLog {
  id: string;
  dataAssetId: string;
  vaultClientId: string;
  sharedBy: string;
  sharedWith: string;
  purpose: string;
  approval: 'GRANTED' | 'PENDING' | 'DENIED';
  expiryDate?: string;
  createdAt: string;
  dataAsset?: { name: string; classification: string };
  vaultClient?: { name: string };
}

export interface DpdpRegister {
  id: string;
  vaultClientId: string;
  registerType: string;
  status: 'ACTIVE' | 'GAP' | 'NA';
  notes?: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AiConversation {
  id: string;
  title: string;
  module: string;
  messages?: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
