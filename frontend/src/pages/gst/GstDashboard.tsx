import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, TrendingUp, CheckCircle, Clock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { formatDate, getStatusColor } from '../../lib/utils';
import type { GstReturn } from '../../types';

const monthlyData = [
  { m: 'Jan', filed: 3 }, { m: 'Feb', filed: 5 }, { m: 'Mar', filed: 7 },
  { m: 'Apr', filed: 4 }, { m: 'May', filed: 6 }, { m: 'Jun', filed: 8 },
];

export default function GstDashboard() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<GstReturn[]>([]);
  const [summary, setSummary] = useState({ total: 0, filed: 0, pending: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<'GSTR1' | 'GSTR3B'>('GSTR1');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/gst?limit=20'),
        api.get('/gst/summary'),
      ]);
      setReturns(listRes.data.data?.items || []);
      setSummary(sumRes.data.data || { total: 0, filed: 0, pending: 0, draft: 0 });
    } finally {
      setLoading(false);
    }
  }

  function createNew() {
    navigate(`/gst/${returnType.toLowerCase()}/new`);
    setShowModal(false);
  }

  const columns = [
    { key: 'returnType', header: 'Type', render: (r: GstReturn) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
          <Receipt size={13} className="text-amber-400" />
        </div>
        <span className="font-medium text-content">{r.returnType}</span>
      </div>
    )},
    { key: 'gstin', header: 'GSTIN', render: (r: GstReturn) => <span className="font-mono text-[12px] text-content-dim">{r.gstin}</span> },
    { key: 'period', header: 'Period', render: (r: GstReturn) => <span className="text-content-dim">{r.period}</span> },
    { key: 'status', header: 'Status', render: (r: GstReturn) => (
      <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(r.status)}`}>
        {r.status}
      </span>
    )},
    { key: 'filedAt', header: 'Filed On', render: (r: GstReturn) => (
      <span className="text-content-dim text-[12px]">{r.filedAt ? formatDate(r.filedAt) : '—'}</span>
    )},
    { key: 'createdAt', header: 'Created', render: (r: GstReturn) => (
      <span className="text-content-dim text-[12px]">{formatDate(r.createdAt)}</span>
    )},
    { key: 'actions', header: '', render: (r: GstReturn) => (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/gst/${r.returnType.toLowerCase()}/${r.id}`); }}>
        Open ›
      </Button>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">GST Returns</h1>
          <p className="text-content-dim text-[13.5px] mt-1">File GSTR-1, GSTR-3B and manage your GST compliance.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          New Return
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Returns', value: summary.total, icon: FileText, color: 'text-content bg-surface-elev2' },
          { label: 'Filed', value: summary.filed, icon: CheckCircle, color: 'text-green-400 bg-green-500/10' },
          { label: 'Pending', value: summary.pending, icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Drafts', value: summary.draft, icon: FileText, color: 'text-content-dim bg-surface-elev2' },
        ].map((s) => (
          <Card key={s.label}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div className="text-[11.5px] text-content-dim font-medium">{s.label}</div>
            <div className="text-[28px] font-bold text-content mt-1">{loading ? '—' : s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card noPad className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Monthly Filings</div>
            <TrendingUp size={15} className="text-content-faint" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="m" tick={{ fill: '#6b748a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b748a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#13161f', border: '1px solid #222838', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="filed" name="Returns Filed" fill="#6d6bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick file */}
        <Card>
          <div className="font-semibold text-content mb-4">Quick File</div>
          <div className="space-y-2.5">
            {[
              { type: 'GSTR-1', desc: 'Outward supplies statement', path: '/gst/gstr1/new', color: 'bg-amber-500/10 text-amber-400' },
              { type: 'GSTR-3B', desc: 'Monthly summary return', path: '/gst/gstr3b/new', color: 'bg-brand/10 text-brand' },
            ].map((r) => (
              <button
                key={r.type}
                onClick={() => navigate(r.path)}
                className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-border bg-surface-elev hover:border-brand transition-colors text-left"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.color}`}>
                  <Receipt size={16} />
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-content">{r.type}</div>
                  <div className="text-[11.5px] text-content-faint">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-brand/5 border border-brand/20">
            <div className="text-[11.5px] text-content-dim">
              <span className="font-semibold text-brand">GSTR-1</span> due on 11th of next month.<br />
              <span className="font-semibold text-brand">GSTR-3B</span> due on 20th of next month.
            </div>
          </div>
        </Card>
      </div>

      {/* Returns table */}
      <Card noPad>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-semibold text-content">All Returns</div>
          <div className="flex gap-2">
            {['ALL','GSTR1','GSTR3B'].map((f) => (
              <button key={f} className="text-[11.5px] px-2.5 py-1 rounded-md border border-border text-content-dim hover:border-brand hover:text-content transition-colors">
                {f}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={columns}
          data={returns}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyText="No GST returns yet. Click 'New Return' to get started."
          onRowClick={(r) => navigate(`/gst/${r.returnType.toLowerCase()}/${r.id}`)}
        />
      </Card>

      {/* Create modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New GST Return"
        subtitle="Select the return type to file"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={createNew}>Continue ›</Button>
          </>
        }
      >
        <div className="space-y-2.5">
          {[
            { type: 'GSTR1', label: 'GSTR-1', desc: 'Outward supplies — B2B, B2C, HSN summary', icon: '📤' },
            { type: 'GSTR3B', label: 'GSTR-3B', desc: 'Monthly summary — tax payable & ITC', icon: '📋' },
          ].map((r) => (
            <label
              key={r.type}
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                returnType === r.type ? 'border-brand bg-brand/10' : 'border-border bg-surface-elev hover:border-brand/50'
              }`}
            >
              <input type="radio" value={r.type} checked={returnType === r.type} onChange={() => setReturnType(r.type as 'GSTR1' | 'GSTR3B')} className="hidden" />
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
