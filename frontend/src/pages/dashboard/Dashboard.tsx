import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, FileText, Users, Clock, Shield, Share2,
  AlertTriangle, TrendingUp, Plus, Bot
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { formatDate, formatCurrency, getRiskBg } from '../../lib/utils';
import type { GstReturn, ItrReturn, SharingLog } from '../../types';

interface DashboardStats {
  gst: { total: number; filed: number; pending: number; draft: number; recent: GstReturn[] };
  itr: { total: number; filed: number; pending: number; draft: number; recent: ItrReturn[] };
  vault: { activeClients: number; closingClients: number; totalAssets: number; highRiskAssets: number; pendingApprovals: number; pendingRetention: number };
}

const chartData = [
  { month: 'Jan', gst: 4, itr: 2 }, { month: 'Feb', gst: 6, itr: 1 }, { month: 'Mar', gst: 8, itr: 5 },
  { month: 'Apr', gst: 5, itr: 3 }, { month: 'May', gst: 7, itr: 4 }, { month: 'Jun', gst: 9, itr: 6 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<SharingLog[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function load() {
      try {
        const [gstRes, itrRes, vaultRes, logsRes] = await Promise.allSettled([
          api.get('/gst/summary'),
          api.get('/itr/summary'),
          api.get('/vaultiq/dashboard'),
          api.get('/vaultiq/sharing-logs?approval=PENDING'),
        ]);

        setStats({
          gst: gstRes.status === 'fulfilled' ? gstRes.value.data.data : { total: 0, filed: 0, pending: 0, draft: 0, recent: [] },
          itr: itrRes.status === 'fulfilled' ? itrRes.value.data.data : { total: 0, filed: 0, pending: 0, draft: 0, recent: [] },
          vault: vaultRes.status === 'fulfilled' ? vaultRes.value.data.data : { activeClients: 0, closingClients: 0, totalAssets: 0, highRiskAssets: 0, pendingApprovals: 0, pendingRetention: 0 },
        });
        if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.data?.slice(0, 5) || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = [
    { label: 'GST Returns Filed', value: stats?.gst.filed ?? 0, sub: `${stats?.gst.pending ?? 0} pending`, color: 'amber', icon: Receipt, go: '/gst' },
    { label: 'ITR Filed', value: stats?.itr.filed ?? 0, sub: `${stats?.itr.pending ?? 0} pending`, color: 'blue', icon: FileText, go: '/itr' },
    { label: 'Active Clients', value: stats?.vault.activeClients ?? 0, sub: `${stats?.vault.closingClients ?? 0} closing`, color: 'brand', icon: Users, go: '/vaultiq/clients' },
    { label: 'High-Risk Assets', value: stats?.vault.highRiskAssets ?? 0, sub: 'needs review', color: 'red', icon: AlertTriangle, go: '/vaultiq/assets' },
    { label: 'Pending Retention', value: stats?.vault.pendingRetention ?? 0, sub: 'action required', color: 'amber', icon: Clock, go: '/vaultiq/retention' },
    { label: 'Pending Approvals', value: stats?.vault.pendingApprovals ?? 0, sub: 'sharing approvals', color: 'red', icon: Share2, go: '/vaultiq/ledger' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    brand: 'text-brand bg-brand/10',
    red: 'text-red-400 bg-red-500/10',
    green: 'text-green-400 bg-green-500/10',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-content-dim text-[13.5px] mt-1">
            Your tax & compliance overview — filings, governance, and data lifecycle at a glance.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="secondary" icon={<Bot size={14} />} onClick={() => navigate('/ai')}>
            Ask AI
          </Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/gst')}>
            New Return
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <Card
            key={k.label}
            hover
            className="cursor-pointer"
            onClick={() => navigate(k.go)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[k.color]}`}>
              <k.icon size={16} />
            </div>
            <div className="text-[11.5px] text-content-dim font-medium">{k.label}</div>
            <div className="text-[28px] font-bold text-content leading-tight mt-1">
              {loading ? '—' : k.value}
            </div>
            <div className={`text-[11.5px] mt-1.5 font-medium ${colorMap[k.color].split(' ')[0]}`}>
              {k.sub}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Filing chart */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="font-semibold text-content">Filing Activity</div>
              <div className="text-[12px] text-content-faint">GST & ITR returns (last 6 months)</div>
            </div>
            <TrendingUp size={16} className="text-content-faint" />
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="month" tick={{ fill: '#6b748a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b748a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#13161f', border: '1px solid #222838', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e7ebf3' }}
                />
                <Bar dataKey="gst" name="GST" fill="#6d6bff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="itr" name="ITR" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attention required */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Attention Required</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vaultiq/retention')}>
              View all ›
            </Button>
          </div>
          <div className="p-3 space-y-1.5">
            {[
              { title: 'Sensitive identifiers detected', desc: 'Aadhaar / Passport assets need minimisation review', color: 'red', icon: Shield, go: '/vaultiq/intel', count: stats?.vault.highRiskAssets },
              { title: 'Assets due for retention review', desc: 'Retention triggers reached', color: 'amber', icon: Clock, go: '/vaultiq/retention', count: stats?.vault.pendingRetention },
              { title: 'Pending sharing approvals', desc: 'Disclosures awaiting partner sign-off', color: 'amber', icon: Share2, go: '/vaultiq/ledger', count: stats?.vault.pendingApprovals },
              { title: 'Engagements closing', desc: 'Run closure workflow for these clients', color: 'blue', icon: Users, go: '/vaultiq/clients', count: stats?.vault.closingClients },
            ].map((a) => (
              <div
                key={a.title}
                onClick={() => navigate(a.go)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface-elev hover:border-brand cursor-pointer transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[a.color]}`}>
                  <a.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-content">{a.title}</div>
                  <div className="text-[11.5px] text-content-faint truncate">{a.desc}</div>
                </div>
                <Badge color={a.color as 'red' | 'amber' | 'blue'}>{loading ? '—' : a.count ?? 0}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent GST */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Recent GST Returns</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/gst')}>View all ›</Button>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="py-8 text-center text-content-faint text-[13px]">Loading…</div>
            ) : (stats?.gst.recent.length ?? 0) === 0 ? (
              <div className="py-8 text-center text-content-faint text-[13px]">No returns filed yet.</div>
            ) : (
              stats?.gst.recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-elev transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Receipt size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px] text-content">{r.returnType}</div>
                    <div className="text-[11.5px] text-content-faint">{r.period} · {r.gstin}</div>
                  </div>
                  <div className="text-right">
                    <Badge color={r.status === 'FILED' ? 'green' : r.status === 'PENDING' ? 'amber' : 'default'}>
                      {r.status}
                    </Badge>
                    <div className="text-[11px] text-content-faint mt-1">{formatDate(r.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent data movement */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Recent Data Movement</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vaultiq/ledger')}>Full ledger ›</Button>
          </div>
          <div className="p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="py-6 text-center text-content-faint text-[13px]">No data movements logged.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="relative pl-5 border-l-2 border-border">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-brand border-2 border-surface-base" />
                  <div className="text-[11.5px] text-content-faint font-semibold">
                    {formatDate(log.createdAt)} · {log.vaultClient?.name}
                  </div>
                  <div className="text-[13px] font-medium text-content mt-0.5">{log.dataAsset?.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-content-faint">{log.sharedBy} → {log.sharedWith}</span>
                    <Badge color={log.approval === 'GRANTED' ? 'green' : 'amber'} className="text-[10.5px]">
                      {log.approval}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <div className="font-semibold text-content mb-4">Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'File GSTR-1', icon: Receipt, color: 'amber', go: '/gst' },
            { label: 'File GSTR-3B', icon: Receipt, color: 'amber', go: '/gst' },
            { label: 'File ITR-1', icon: FileText, color: 'blue', go: '/itr' },
            { label: 'Add Client', icon: Users, color: 'brand', go: '/vaultiq/clients' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.go)}
              className="flex items-center gap-2.5 p-3.5 rounded-lg border border-border bg-surface-elev hover:border-brand transition-colors text-left group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[a.color]}`}>
                <a.icon size={15} />
              </div>
              <span className="text-[13px] font-medium text-content-dim group-hover:text-content transition-colors">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
