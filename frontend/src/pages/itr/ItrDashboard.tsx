import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle, Clock, Calculator } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { formatDate, getStatusColor } from '../../lib/utils';
import type { ItrReturn } from '../../types';

export default function ItrDashboard() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ItrReturn[]>([]);
  const [summary, setSummary] = useState({ total: 0, filed: 0, pending: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<'ITR1' | 'ITR2'>('ITR1');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([api.get('/itr?limit=20'), api.get('/itr/summary')]);
      setReturns(listRes.data.data?.items || []);
      setSummary(sumRes.data.data || { total: 0, filed: 0, pending: 0, draft: 0 });
    } finally { setLoading(false); }
  }

  const columns = [
    { key: 'returnType', header: 'Type', render: (r: ItrReturn) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
          <FileText size={13} className="text-blue-400" />
        </div>
        <span className="font-medium text-content">{r.returnType}</span>
      </div>
    )},
    { key: 'pan', header: 'PAN', render: (r: ItrReturn) => <span className="font-mono text-[12px] text-content-dim">{r.pan}</span> },
    { key: 'assessmentYear', header: 'AY', render: (r: ItrReturn) => <span className="text-content-dim">{r.assessmentYear}</span> },
    { key: 'status', header: 'Status', render: (r: ItrReturn) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(r.status)}`}>{r.status}</span>
    )},
    { key: 'filedAt', header: 'Filed On', render: (r: ItrReturn) => <span className="text-content-dim text-[12px]">{r.filedAt ? formatDate(r.filedAt) : '—'}</span> },
    { key: 'createdAt', header: 'Created', render: (r: ItrReturn) => <span className="text-content-dim text-[12px]">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: '', render: (r: ItrReturn) => (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/itr/${r.returnType.toLowerCase()}/${r.id}`); }}>Open ›</Button>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">Income Tax Returns</h1>
          <p className="text-content-dim text-[13.5px] mt-1">File ITR-1 (Sahaj) and ITR-2 — AY 2025-26.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New Return</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Returns', value: summary.total, icon: FileText, color: 'text-content bg-surface-elev2' },
          { label: 'Filed', value: summary.filed, icon: CheckCircle, color: 'text-green-400 bg-green-500/10' },
          { label: 'Pending', value: summary.pending, icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Drafts', value: summary.draft, icon: Calculator, color: 'text-blue-400 bg-blue-500/10' },
        ].map((s) => (
          <Card key={s.label}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}><s.icon size={16} /></div>
            <div className="text-[11.5px] text-content-dim font-medium">{s.label}</div>
            <div className="text-[28px] font-bold text-content mt-1">{loading ? '—' : s.value}</div>
          </Card>
        ))}
      </div>

      {/* Tax regime info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { regime: 'New Regime (Default)', slabs: ['Up to ₹3L: Nil', '₹3L–₹7L: 5%', '₹7L–₹10L: 10%', '₹10L–₹12L: 15%', '₹12L–₹15L: 20%', 'Above ₹15L: 30%'], note: '87A rebate up to ₹25,000 (income ≤ ₹7L)', color: 'brand' },
          { regime: 'Old Regime', slabs: ['Up to ₹2.5L: Nil', '₹2.5L–₹5L: 5%', '₹5L–₹10L: 20%', 'Above ₹10L: 30%'], note: 'Deductions: 80C (₹1.5L), 80D, 80G etc.', color: 'blue' },
        ].map((r) => (
          <Card key={r.regime}>
            <div className={`font-semibold text-content mb-3 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${r.color === 'brand' ? 'bg-brand' : 'bg-blue-400'}`} />
              {r.regime} — AY 2025-26
            </div>
            <div className="space-y-1">
              {r.slabs.map((s) => (
                <div key={s} className="text-[12.5px] text-content-dim flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-content-faint flex-shrink-0" />{s}
                </div>
              ))}
            </div>
            <div className={`mt-3 text-[11.5px] px-3 py-2 rounded-lg ${r.color === 'brand' ? 'bg-brand/10 text-brand' : 'bg-blue-500/10 text-blue-400'}`}>
              {r.note}
            </div>
          </Card>
        ))}
      </div>

      <Card noPad>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-semibold text-content">All Returns</div>
        </div>
        <Table columns={columns} data={returns} loading={loading} keyExtractor={(r) => r.id}
          emptyText="No ITR filed yet. Click 'New Return' to get started."
          onRowClick={(r) => navigate(`/itr/${r.returnType.toLowerCase()}/${r.id}`)} />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Income Tax Return" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { navigate(`/itr/${returnType.toLowerCase()}/new`); setShowModal(false); }}>Continue ›</Button>
        </>}
      >
        <div className="space-y-2.5">
          {[
            { type: 'ITR1', label: 'ITR-1 (Sahaj)', desc: 'Salary, one house property, other income — up to ₹50L', icon: '📄' },
            { type: 'ITR2', label: 'ITR-2', desc: 'Capital gains, multiple properties, foreign income', icon: '📊' },
          ].map((r) => (
            <label key={r.type} className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${returnType === r.type ? 'border-brand bg-brand/10' : 'border-border bg-surface-elev hover:border-brand/50'}`}>
              <input type="radio" value={r.type} checked={returnType === r.type} onChange={() => setReturnType(r.type as 'ITR1' | 'ITR2')} className="hidden" />
              <span className="text-xl">{r.icon}</span>
              <div>
                <div className="font-semibold text-content text-[13px]">{r.label}</div>
                <div className="text-[12px] text-content-faint">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
