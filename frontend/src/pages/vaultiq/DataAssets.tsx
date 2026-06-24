import { useEffect, useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { formatDate, getClassificationColor, getRiskScoreColor } from '../../lib/utils';
import type { DataAsset } from '../../types';

const CLASSIFICATIONS = ['All', 'Highly Restricted', 'Restricted', 'Confidential', 'Internal', 'Public'];

export default function DataAssets() {
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<DataAsset | null>(null);

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await api.get('/vaultiq/assets');
      setAssets(res.data.data || []);
    } finally { setLoading(false); }
  }

  const filtered = filter === 'All' ? assets : assets.filter((a) => a.classification === filter);

  const columns = [
    { key: 'name', header: 'Document', render: (a: DataAsset) => (
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${a.isSdp ? 'bg-red-500/10' : 'bg-brand/10'}`}>
          {a.isSdp ? <AlertTriangle size={13} className="text-red-400" /> : <Database size={13} className="text-brand" />}
        </div>
        <div>
          <div className="font-medium text-content text-[13px] max-w-[200px] truncate">{a.name}</div>
          <div className="text-[11px] text-content-faint">{a.service}</div>
        </div>
      </div>
    )},
    { key: 'client', header: 'Client', render: (a: DataAsset) => (
      <span className="text-content-dim text-[12.5px]">{a.vaultClient?.name || '—'}</span>
    )},
    { key: 'classification', header: 'Classification', render: (a: DataAsset) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${getClassificationColor(a.classification)}`}>
        {a.classification}
      </span>
    )},
    { key: 'riskScore', header: 'Risk', render: (a: DataAsset) => (
      <span className={`font-bold text-[13px] ${getRiskScoreColor(a.riskScore)}`}>{a.riskScore}</span>
    )},
    { key: 'isSdp', header: 'SDP', render: (a: DataAsset) => (
      a.isSdp ? <Badge color="red">SDP</Badge> : <span className="text-content-faint text-[12px]">—</span>
    )},
    { key: 'owner', header: 'Owner', render: (a: DataAsset) => <span className="text-content-dim text-[12.5px]">{a.owner}</span> },
    { key: 'disposal', header: 'Disposal', render: (a: DataAsset) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${
        a.disposal === 'Delete' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
        a.disposal === 'Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
        a.disposal === 'Archive' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
        'bg-green-500/10 text-green-400 border-green-500/20'
      }`}>
        {a.disposal}
      </span>
    )},
    { key: 'uploadDate', header: 'Uploaded', render: (a: DataAsset) => (
      <span className="text-content-dim text-[12px]">{formatDate(a.uploadDate)}</span>
    )},
  ];

  const sdpCount = assets.filter((a) => a.isSdp).length;
  const highRisk = assets.filter((a) => a.riskScore >= 70).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">Data Asset Registry</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Every document classified, risk-scored and tracked through its lifecycle.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets', value: assets.length, color: 'text-content' },
          { label: 'Sensitive (SDP)', value: sdpCount, color: 'text-red-400' },
          { label: 'High Risk (≥70)', value: highRisk, color: 'text-red-400' },
          { label: 'Due for Action', value: assets.filter((a) => a.disposal !== 'Active').length, color: 'text-amber-400' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-[11.5px] text-content-dim">{s.label}</div>
            <div className={`text-[28px] font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</div>
          </Card>
        ))}
      </div>

      <Card noPad>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-wrap gap-2">
          <div className="font-semibold text-content">All Assets ({filtered.length})</div>
          <div className="flex gap-1.5 flex-wrap">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`text-[11.5px] px-2.5 py-1 rounded-md border transition-colors ${filter === c ? 'border-brand bg-brand/10 text-brand' : 'border-border text-content-dim hover:border-brand hover:text-content'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          keyExtractor={(a) => a.id}
          emptyText="No data assets registered."
          onRowClick={(a) => setSelected(a)}
        />
      </Card>

      {/* Asset detail */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.name} subtitle={`${selected.service} · ${selected.vaultClient?.name}`} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-elev border border-border">
                <div className="text-[11px] text-content-faint">Classification</div>
                <div className={`mt-1 text-[13px] font-semibold ${getClassificationColor(selected.classification).split(' ')[1]}`}>{selected.classification}</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-elev border border-border">
                <div className="text-[11px] text-content-faint">Risk Score</div>
                <div className={`mt-1 text-[22px] font-bold ${getRiskScoreColor(selected.riskScore)}`}>{selected.riskScore}/100</div>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-content-dim mb-2">Data Categories</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.categories.map((c) => (
                  <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-elev2 border border-border text-content-dim">{c}</span>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-[13px]">
              {[
                ['Storage Folder', selected.storageFolder],
                ['Sharing Policy', selected.sharingPolicy],
                ['Retention Trigger', selected.retentionTrigger],
                ['Retention Action', selected.retentionAction],
                ['Owner', selected.owner],
                ['Sensitive Data Point (SDP)', selected.isSdp ? '⚠️ Yes — heightened safeguards required' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-1.5 border-b border-border/50">
                  <dt className="w-36 text-content-faint flex-shrink-0 text-[12px]">{k}</dt>
                  <dd className="font-medium text-content text-[12.5px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
}
