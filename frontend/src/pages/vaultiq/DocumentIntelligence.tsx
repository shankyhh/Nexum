import { useState } from 'react';
import { Brain, Upload, FileSearch, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import { getClassificationColor, getRiskScoreColor } from '../../lib/utils';

interface ClassifyResult {
  categories: string[];
  classification: string;
  riskScore: number;
  sensitivity: number;
  isSdp: boolean;
  storageFolder: string;
  sharingPolicy: string;
  retentionRule: { trigger: string; period: string; action: string };
}

interface HistoryItem { fileName: string; result: ClassifyResult; timestamp: string; }

const SAMPLE_FILES = [
  'Employee Payroll Register FY26.xlsx',
  'Aadhaar - Plant Workers (PF UAN).pdf',
  'Audited Financials FY26.pdf',
  'Founder Passports (KYC).pdf',
  'GSTR Reconciliation Q1.xlsx',
  'Bank Statements - Current Account.pdf',
  'Customer Contracts - Top 20.pdf',
  'Board Resolutions & Registers.pdf',
];

export default function DocumentIntelligence() {
  const [fileName, setFileName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function classify() {
    if (!fileName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/vaultiq/assets/classify', { fileName, categories });
      setResult(res.data.data);
      setHistory((prev) => [{ fileName, result: res.data.data, timestamp: new Date().toISOString() }, ...prev.slice(0, 9)]);
    } finally { setLoading(false); }
  }

  function useSample(name: string) {
    setFileName(name);
    setResult(null);
  }

  const riskBarColor = (score: number) => score >= 70 ? 'bg-red-400' : score >= 45 ? 'bg-amber-400' : 'bg-green-400';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-bold text-content tracking-tight">Document Intelligence</h1>
        <p className="text-content-dim text-[13.5px] mt-1">AI classifies documents, scores risk, and routes them to the right storage folder.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Classifier */}
        <div className="space-y-4">
          <Card>
            <div className="font-semibold text-content mb-3 flex items-center gap-2">
              <Brain size={16} className="text-brand" /> Classify Document
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4 hover:border-brand transition-colors">
              <Upload size={24} className="mx-auto mb-2 text-content-faint" />
              <div className="text-[13px] text-content-dim mb-1">Drag & drop or enter filename below</div>
              <div className="text-[11.5px] text-content-faint">Filename-based AI classification</div>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={fileName}
                onChange={(e) => { setFileName(e.target.value); setResult(null); }}
                placeholder="e.g. Employee Payroll FY26.xlsx"
                className="flex-1 bg-surface-elev border border-border rounded-md px-3 py-2.5 text-[13px] text-content outline-none focus:border-brand placeholder:text-content-faint"
                onKeyDown={(e) => e.key === 'Enter' && classify()}
              />
              <Button variant="primary" icon={<FileSearch size={14} />} loading={loading} onClick={classify} disabled={!fileName.trim()}>
                Classify
              </Button>
            </div>

            <div>
              <div className="text-[11.5px] font-semibold text-content-dim mb-2">Sample documents:</div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_FILES.map((f) => (
                  <button key={f} onClick={() => useSample(f)}
                    className="text-[11px] px-2 py-1 rounded border border-dashed border-border text-content-faint hover:border-brand hover:text-content transition-colors truncate max-w-[180px]" title={f}>
                    {f.length > 25 ? f.slice(0, 25) + '…' : f}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Result */}
          {result && (
            <Card className="border-brand/30 animate-fade-in">
              <div className="font-semibold text-content mb-4 flex items-center gap-2">
                ✦ Classification Result — <span className="text-brand font-mono text-[12px]">{fileName}</span>
              </div>

              <div className="space-y-3">
                {/* Risk bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-content-dim font-semibold">Risk Score</span>
                    <span className={`font-bold text-[15px] ${getRiskScoreColor(result.riskScore)}`}>{result.riskScore}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${riskBarColor(result.riskScore)}`} style={{ width: `${result.riskScore}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${getClassificationColor(result.classification)}`}>
                    {result.classification}
                  </span>
                  <span className="text-[12px] text-content-dim">Sensitivity: <b className="text-content">{result.sensitivity}/10</b></span>
                  {result.isSdp && <Badge color="red"><AlertTriangle size={10} /> SDP</Badge>}
                </div>

                <div>
                  <div className="text-[11.5px] font-semibold text-content-dim mb-1.5">Categories Detected:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.categories.map((c) => (
                      <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-elev2 border border-border text-content-dim">{c}</span>
                    ))}
                  </div>
                </div>

                <dl className="space-y-2 text-[12.5px]">
                  {[
                    ['📁 Storage Folder', result.storageFolder],
                    ['🔒 Sharing Policy', result.sharingPolicy],
                    ['⏱ Retention Trigger', result.retentionRule.trigger],
                    ['📅 Retention Period', result.retentionRule.period],
                    ['🗑 Action', result.retentionRule.action],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 py-1 border-b border-border/50">
                      <dt className="text-content-faint w-36 flex-shrink-0 text-[11.5px]">{k}</dt>
                      <dd className="font-medium text-content">{v}</dd>
                    </div>
                  ))}
                </dl>

                {result.isSdp && (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[12px] text-red-400">
                    <span className="font-semibold">⚠️ Sensitive Data Point: </span>
                    This document contains a sensitive identifier. DPDP Act requires heightened safeguards — collect only where statutorily mandated and delete after purpose completion.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* History */}
        <Card noPad>
          <div className="px-4 py-3.5 border-b border-border font-semibold text-content">Classification History</div>
          {history.length === 0 ? (
            <div className="py-12 text-center text-content-faint">
              <Brain size={28} className="mx-auto mb-2 opacity-30" />
              <div className="text-[13px]">No documents classified yet.</div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {history.map((h, i) => (
                <div key={i} onClick={() => { setFileName(h.fileName); setResult(h.result); }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface-elev cursor-pointer transition-colors">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${h.result.isSdp ? 'bg-red-500/10' : 'bg-brand/10'}`}>
                    {h.result.isSdp ? <AlertTriangle size={12} className="text-red-400" /> : <Brain size={12} className="text-brand" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-content truncate">{h.fileName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${getClassificationColor(h.result.classification)}`}>
                        {h.result.classification}
                      </span>
                      <span className={`text-[11px] font-bold ${getRiskScoreColor(h.result.riskScore)}`}>Risk {h.result.riskScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
