import { useEffect, useState } from 'react';
import { Clock, Trash2, Archive, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import api from '../../lib/api';
import { formatDate, getClassificationColor, getRiskScoreColor } from '../../lib/utils';
import type { DataAsset } from '../../types';

export default function RetentionEngine() {
  const [items, setItems] = useState<DataAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/vaultiq/retention');
      setItems(res.data.data || []);
    } finally { setLoading(false); }
  }

  const deleteItems = items.filter((a) => a.retentionAction === 'Delete');
  const reviewItems = items.filter((a) => a.retentionAction === 'Review');
  const archiveItems = items.filter((a) => a.retentionAction === 'Archive');

  const columns = [
    { key: 'name', header: 'Document', render: (a: DataAsset) => (
      <div>
        <div className="font-medium text-[13px] text-content">{a.name}</div>
        <div className="text-[11px] text-content-faint">{a.vaultClient?.name} · {a.service}</div>
      </div>
    )},
    { key: 'classification', header: 'Classification', render: (a: DataAsset) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${getClassificationColor(a.classification)}`}>
        {a.classification}
      </span>
    )},
    { key: 'riskScore', header: 'Risk', render: (a: DataAsset) => (
      <span className={`font-bold ${getRiskScoreColor(a.riskScore)}`}>{a.riskScore}</span>
    )},
    { key: 'retentionTrigger', header: 'Trigger', render: (a: DataAsset) => (
      <span className="text-content-dim text-[12px]">{a.retentionTrigger}</span>
    )},
    { key: 'retentionAction', header: 'Action', render: (a: DataAsset) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${
        a.retentionAction === 'Delete' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
        a.retentionAction === 'Archive' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
        'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}>
        {a.retentionAction}
      </span>
    )},
    { key: 'owner', header: 'Owner', render: (a: DataAsset) => <span className="text-content-dim text-[12px]">{a.owner}</span> },
    { key: 'uploadDate', header: 'Uploaded', render: (a: DataAsset) => (
      <span className="text-content-dim text-[12px]">{formatDate(a.uploadDate)}</span>
    )},
  ];

  const Section = ({ title, desc, count, color, icon: Icon, data }: {
    title: string; desc: string; count: number; color: string; icon: React.ElementType; data: DataAsset[];
  }) => (
    <Card noPad>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-content">{title} <span className="text-content-faint font-normal">({count})</span></div>
          <div className="text-[12px] text-content-faint">{desc}</div>
        </div>
        {count > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">Select All</Button>
            <Button size="sm" variant="danger" icon={<Icon size={12} />}>Process All</Button>
          </div>
        )}
      </div>
      <Table columns={columns} data={data} loading={loading} keyExtractor={(a) => a.id} emptyText={`No documents require ${title.toLowerCase()}.`} />
    </Card>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">Retention Engine</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Documents with reached retention triggers — delete, archive or review.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>Refresh</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Due for Deletion', value: deleteItems.length, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Due for Review', value: reviewItems.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Due for Archive', value: archiveItems.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-[11.5px] text-content-dim">{s.label}</div>
            <div className={`text-[28px] font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</div>
          </Card>
        ))}
      </div>

      {/* DPDP note */}
      <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[12.5px] text-content-dim">
        <span className="font-semibold text-amber-400">DPDP §8(7) Storage Limitation: </span>
        Personal data must not be retained beyond the period necessary for the stated purpose. Aadhaar and biometric data must be deleted immediately after use.
        <span className="text-amber-400 font-semibold"> Use the Closure Engine for bulk deletion with a compliance certificate.</span>
      </div>

      <Section title="Delete" desc="Sensitive identifiers and data past retention period" count={deleteItems.length} color="bg-red-500/10 text-red-400" icon={Trash2} data={deleteItems} />
      <Section title="Review" desc="Documents requiring manager review before action" count={reviewItems.length} color="bg-amber-500/10 text-amber-400" icon={Clock} data={reviewItems} />
      <Section title="Archive" desc="Documents to be moved to cold storage" count={archiveItems.length} color="bg-blue-500/10 text-blue-400" icon={Archive} data={archiveItems} />
    </div>
  );
}
