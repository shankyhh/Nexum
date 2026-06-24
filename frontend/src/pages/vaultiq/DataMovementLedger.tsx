import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import api from '../../lib/api';
import { formatDate, getApprovalColor } from '../../lib/utils';
import type { SharingLog } from '../../types';

export default function DataMovementLedger() {
  const [logs, setLogs] = useState<SharingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/vaultiq/sharing-logs');
      setLogs(res.data.data || []);
    } finally { setLoading(false); }
  }

  async function updateApproval(id: string, approval: 'GRANTED' | 'DENIED') {
    try {
      await api.patch(`/vaultiq/sharing-logs/${id}/approval`, { approval });
      setLogs((prev) => prev.map((l) => l.id === id ? { ...l, approval } : l));
    } catch {}
  }

  const filtered = filter === 'ALL' ? logs : logs.filter((l) => l.approval === filter);

  const columns = [
    { key: 'asset', header: 'Document', render: (l: SharingLog) => (
      <div>
        <div className="font-medium text-[13px] text-content">{l.dataAsset?.name}</div>
        <div className="text-[11px] text-content-faint">{l.vaultClient?.name}</div>
      </div>
    )},
    { key: 'classification', header: 'Classification', render: (l: SharingLog) => (
      l.dataAsset?.classification ? (
        <span className="text-[11.5px] font-semibold px-1.5 py-0.5 rounded border bg-brand/10 text-brand border-brand/20">
          {l.dataAsset.classification}
        </span>
      ) : <span>—</span>
    )},
    { key: 'sharedBy', header: 'Shared By', render: (l: SharingLog) => <span className="text-content-dim text-[12.5px]">{l.sharedBy}</span> },
    { key: 'sharedWith', header: 'Shared With', render: (l: SharingLog) => (
      <span className={`text-[12.5px] font-medium ${/external/i.test(l.sharedWith) ? 'text-amber-400' : 'text-content-dim'}`}>
        {l.sharedWith}
      </span>
    )},
    { key: 'purpose', header: 'Purpose', render: (l: SharingLog) => <span className="text-content-dim text-[12px]">{l.purpose}</span> },
    { key: 'approval', header: 'Approval', render: (l: SharingLog) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${getApprovalColor(l.approval)}`}>
        {l.approval}
      </span>
    )},
    { key: 'expiryDate', header: 'Expiry', render: (l: SharingLog) => (
      <span className="text-content-dim text-[12px]">{l.expiryDate ? formatDate(l.expiryDate) : '—'}</span>
    )},
    { key: 'createdAt', header: 'Date', render: (l: SharingLog) => (
      <span className="text-content-dim text-[12px]">{formatDate(l.createdAt)}</span>
    )},
    { key: 'actions', header: '', render: (l: SharingLog) => (
      l.approval === 'PENDING' ? (
        <div className="flex gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); updateApproval(l.id, 'GRANTED'); }}
            className="w-7 h-7 rounded flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-colors" title="Grant">
            <CheckCircle size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); updateApproval(l.id, 'DENIED'); }}
            className="w-7 h-7 rounded flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors" title="Deny">
            <XCircle size={14} />
          </button>
        </div>
      ) : null
    )},
  ];

  const pending = logs.filter((l) => l.approval === 'PENDING').length;
  const external = logs.filter((l) => /external/i.test(l.sharedWith)).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">Data Movement Ledger</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Every data disclosure logged with purpose, approval status and expiry.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Movements', value: logs.length, color: 'text-content' },
          { label: 'Pending Approval', value: pending, color: 'text-amber-400' },
          { label: 'External Shares', value: external, color: 'text-red-400' },
          { label: 'Granted', value: logs.filter((l) => l.approval === 'GRANTED').length, color: 'text-green-400' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-[11.5px] text-content-dim">{s.label}</div>
            <div className={`text-[28px] font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</div>
          </Card>
        ))}
      </div>

      {pending > 0 && (
        <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[12.5px] text-content-dim flex items-start gap-2">
          <BookOpen size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-semibold text-amber-400">{pending} sharing request{pending > 1 ? 's' : ''} pending approval. </span>
            DPDP Act requires logged approval and purpose limitation for every external disclosure. Click ✓ or ✗ to action each request.
          </span>
        </div>
      )}

      <Card noPad>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-wrap gap-2">
          <div className="font-semibold text-content">All Movements ({filtered.length})</div>
          <div className="flex gap-1.5">
            {['ALL','PENDING','GRANTED','DENIED'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[11.5px] px-2.5 py-1 rounded-md border transition-colors ${filter === f ? 'border-brand bg-brand/10 text-brand' : 'border-border text-content-dim hover:border-brand hover:text-content'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          keyExtractor={(l) => l.id}
          emptyText="No data movements logged yet."
        />
      </Card>
    </div>
  );
}
