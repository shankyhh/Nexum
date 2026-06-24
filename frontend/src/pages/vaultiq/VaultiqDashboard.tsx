import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Database, AlertTriangle, Clock, Share2, CheckCircle, Shield, Plus, Bot } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { formatDate, getRiskBg } from '../../lib/utils';
import type { SharingLog, VaultClient } from '../../types';

interface Stats { activeClients: number; closingClients: number; totalAssets: number; highRiskAssets: number; pendingApprovals: number; pendingRetention: number; }

export default function VaultiqDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<SharingLog[]>([]);
  const [clients, setClients] = useState<VaultClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, logsRes, clientsRes] = await Promise.allSettled([
          api.get('/vaultiq/dashboard'),
          api.get('/vaultiq/sharing-logs'),
          api.get('/vaultiq/clients'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.data?.slice(0, 5) || []);
        if (clientsRes.status === 'fulfilled') setClients(clientsRes.value.data.data?.slice(0, 3) || []);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  // compute avg DPDP score
  const avgDpdp = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + (c.dpdpScore || 0), 0) / clients.length) : 0;
  const dpdpColor = avgDpdp >= 70 ? '#34d399' : avgDpdp >= 45 ? '#fbbf24' : '#f87171';

  const kpis = [
    { label: 'Active Clients', value: stats?.activeClients ?? 0, sub: `${stats?.closingClients ?? 0} closing`, color: 'bg-brand/10 text-brand', icon: Users, go: '/vaultiq/clients' },
    { label: 'Data Assets', value: stats?.totalAssets ?? 0, sub: 'all clients', color: 'bg-blue-500/10 text-blue-400', icon: Database, go: '/vaultiq/assets' },
    { label: 'High-Risk Assets', value: stats?.highRiskAssets ?? 0, sub: 'needs review', color: 'bg-red-500/10 text-red-400', icon: AlertTriangle, go: '/vaultiq/assets' },
    { label: 'Pending Retention', value: stats?.pendingRetention ?? 0, sub: 'action required', color: 'bg-amber-500/10 text-amber-400', icon: Clock, go: '/vaultiq/retention' },
    { label: 'External Shares', value: logs.filter(l => /external/i.test(l.sharedWith)).length, sub: 'all logged', color: 'bg-blue-500/10 text-blue-400', icon: Share2, go: '/vaultiq/ledger' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, sub: 'awaiting sign-off', color: 'bg-red-500/10 text-red-400', icon: AlertTriangle, go: '/vaultiq/ledger' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">VAULTIQ</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Client data lifecycle — collection to disposal, fully governed.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={<Bot size={14} />} onClick={() => navigate('/ai')}>Ask VAULTIQ AI</Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/vaultiq/clients')}>New Engagement</Button>
        </div>
      </div>

      {/* KPIs + DPDP Ring */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} hover onClick={() => navigate(k.go)} className="cursor-pointer">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
              <k.icon size={15} />
            </div>
            <div className="text-[11.5px] text-content-dim font-medium">{k.label}</div>
            <div className="text-[26px] font-bold text-content mt-1">{loading ? '—' : k.value}</div>
            <div className={`text-[11px] mt-1 font-medium ${k.color.split(' ')[1]}`}>{k.sub}</div>
          </Card>
        ))}

        {/* DPDP Ring */}
        <Card className="xl:col-span-1 flex items-center gap-3">
          <div
            className="ring flex-shrink-0"
            style={{ '--p': avgDpdp, '--c': dpdpColor, width: 64, height: 64 } as React.CSSProperties}
          >
            <div className="w-12 h-12 rounded-full bg-surface-panel flex items-center justify-center mx-auto mt-1 ml-1">
              <div className="text-center">
                <div className="text-[14px] font-bold text-content">{avgDpdp}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-[12.5px] text-content">DPDP Score</div>
            <div className="text-[11px] text-content-faint">Firm avg</div>
            <button onClick={() => navigate('/vaultiq/dpdp')} className="text-[11px] text-brand mt-1 hover:brightness-110">View gaps ›</button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent data movement */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Recent Data Movement</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vaultiq/ledger')}>Full ledger ›</Button>
          </div>
          <div className="p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="py-6 text-center text-content-faint text-[13px]">No data movements logged.</div>
            ) : logs.map((l) => (
              <div key={l.id} className="relative pl-5 border-l-2 border-border">
                <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-surface-base" />
                <div className="text-[11.5px] text-content-faint font-semibold">{formatDate(l.createdAt)} · {l.vaultClient?.name}</div>
                <div className="text-[13px] font-medium text-content mt-0.5">{l.dataAsset?.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] text-content-faint">{l.sharedBy} → {l.sharedWith} · {l.purpose}</span>
                  <Badge color={l.approval === 'GRANTED' ? 'green' : 'amber'} className="text-[10px]">{l.approval}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attention required */}
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Attention Required</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vaultiq/retention')}>Retention ›</Button>
          </div>
          <div className="p-3 space-y-1.5">
            {[
              { t: 'Sensitive identifiers detected', d: 'Aadhaar/Passport assets — minimisation review', color: 'red', icon: Shield, go: '/vaultiq/intel', count: stats?.highRiskAssets },
              { t: 'Assets due for review', d: 'Retention triggers reached', color: 'amber', icon: Clock, go: '/vaultiq/retention', count: stats?.pendingRetention },
              { t: 'External share pending approval', d: 'Disclosure awaiting partner sign-off', color: 'amber', icon: Share2, go: '/vaultiq/ledger', count: stats?.pendingApprovals },
              { t: 'Engagements closing', d: 'Run closure workflow', color: 'blue', icon: CheckCircle, go: '/vaultiq/clients', count: stats?.closingClients },
            ].map((a) => (
              <div key={a.t} onClick={() => navigate(a.go)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface-elev hover:border-brand cursor-pointer transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-${a.color}-500/10 text-${a.color}-400`}>
                  <a.icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] text-content">{a.t}</div>
                  <div className="text-[11.5px] text-content-faint truncate">{a.d}</div>
                </div>
                <Badge color={a.color as 'red' | 'amber' | 'blue'}>{loading ? '—' : a.count ?? 0}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Client overview */}
      {clients.length > 0 && (
        <Card noPad>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-content">Active Clients</div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/vaultiq/clients')}>View all ›</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {clients.map((c) => (
              <div key={c.id} onClick={() => navigate('/vaultiq/clients')} className="p-4 hover:bg-surface-elev cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-content truncate">{c.name}</div>
                    <div className="text-[11px] text-content-faint">{c.industry}</div>
                  </div>
                  <Badge color={c.status === 'ACTIVE' ? 'green' : 'amber'} dot className="ml-auto">{c.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-content-faint">Risk</span>
                  <span className={`font-semibold ${getRiskBg(c.riskBand).split(' ')[1]}`}>{c.riskScore} · {c.riskBand}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] mt-1">
                  <span className="text-content-faint">DPDP</span>
                  <span className="font-semibold" style={{ color: (c.dpdpScore || 0) >= 70 ? '#34d399' : (c.dpdpScore || 0) >= 45 ? '#fbbf24' : '#f87171' }}>
                    {c.dpdpScore ?? 0}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
