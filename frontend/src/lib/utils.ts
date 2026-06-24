import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Classification, RiskBand, ReturnStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...opts,
  });
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function getRiskColor(band: RiskBand | string): string {
  if (band === 'High') return 'text-red-400';
  if (band === 'Medium') return 'text-amber-400';
  return 'text-green-400';
}

export function getRiskBg(band: RiskBand | string): string {
  if (band === 'High') return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (band === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-green-500/10 text-green-400 border-green-500/20';
}

export function getClassificationColor(cls: Classification | string): string {
  const map: Record<string, string> = {
    'Public': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Internal': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Confidential': 'bg-brand/10 text-brand border-brand/20',
    'Restricted': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Highly Restricted': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[cls] || 'bg-surface-elev text-content-dim border-border';
}

export function getStatusColor(status: ReturnStatus | string): string {
  const map: Record<string, string> = {
    FILED: 'bg-green-500/10 text-green-400 border-green-500/20',
    DRAFT: 'bg-surface-elev text-content-dim border-border',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[status] || map.DRAFT;
}

export function getApprovalColor(approval: string): string {
  if (approval === 'GRANTED') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (approval === 'DENIED') return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
}

export function getRiskScoreColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-green-400';
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export const SERVICES = [
  'Statutory Audit', 'Internal Audit', 'Tax Audit', 'GST Compliance',
  'Payroll', 'Secretarial Compliance', 'Virtual CFO', 'Due Diligence',
  'M&A', 'Litigation Support', 'FEMA Advisory', 'Transfer Pricing', 'Other',
];

export const INDUSTRIES = [
  'Manufacturing', 'Technology', 'Financial Services', 'Healthcare',
  'Retail', 'Real Estate', 'Pharma', 'Logistics', 'E-commerce', 'Education', 'Other',
];

export const JURISDICTIONS = [
  'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana',
  'Gujarat', 'Rajasthan', 'West Bengal', 'Uttar Pradesh', 'Kerala', 'Other',
];
