import { useEffect, useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import type { VaultClient, DpdpRegister } from '../../types';

interface DpdpReadiness { score: number; gaps: string[]; registers: DpdpRegister[]; }
interface ClientDpdp { client: VaultClient; readiness: DpdpReadiness; }

const REGISTER_META: Record<string, { label: string; desc: string; weight: number }> = {
  notice:    { label: 'Notice (§5)', desc: 'Data principal notice issued before/at collection', weight: 18 },
  purpose:   { label: 'Purpose Register (§8)', desc: 'Processing purposes documented', weight: 14 },
  sharing:   { label: 'Data Sharing Register', desc: 'Every external disclosure logged with expiry', weight: 14 },
  retention: { label: 'Retention Register', desc: 'Retention triggers and periods defined', weight: 16 },
  deletion:  { label: 'Deletion Register', desc: 'Data deletion schedule and certificates', weight: 14 },
  access:    { label: 'Access Control Register', desc: 'Role-based access matrix maintained', weight: 10 },
  vendor:    { label: 'Vendor DPA Register', desc: 'Data Processing Agreements with sub-processors', weight: 8 },
  consent:   { label: 'Consent Register', desc: 'Consent records for high-sensitivity processing', weight: 6 },
};

export default function DpdpCenter() {
  const [clientDpdp, setClientDpdp] = useState<ClientDpdp[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const clientsRes = await api.get('/vaultiq/clients');
      const clients: VaultClient[] = clientsRes.data.data || [];

      const dpdpResults = await Promise.allSettled(
        clients.map((c) => api.get(`/vaultiq/dpdp/${c.id}/readiness`))
      );

      setClientDpdp(clients.map((c, i) => ({
        client: c,
        readiness: dpdpResults[i].status === 'fulfilled' ? dpdpResults[i].value.data.data : { score: 0, gaps: [], registers: [] },
      })));
    } finally { setLoading(false); }
  }

  async function toggleRegister(clientId: string, registerType: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'GAP' : 'ACTIVE';
    setUpdating(`${clientId}-${registerType}`);
    try {
      await api.put(`/vaultiq/dpdp/${clientId}/register`, { registerType, status: newStatus });
      setClientDpdp((prev) => prev.map((cd) => {
        if (cd.client.id !== clientId) return cd;
        const updatedRegs = cd.readiness.registers.map((r) =>
          r.registerType === registerType ? { ...r, status: newStatus as 'ACTIVE' | 'GAP' | 'NA' } : r
        );
        const score = Math.round(updatedRegs.filter((r) => r.status === 'ACTIVE')
          .reduce((s, r) => s + (REGISTER_META[r.registerType]?.weight || 0), 0));
        return {
          ...cd,
          readiness: { ...cd.readiness, registers: updatedRegs, score, gaps: updatedRegs.filter((r) => r.status === 'GAP').map((r) => r.registerType) },
        };
      }));
    } finally { setUpdating(null); }
  }

  const scoreColor = (s: number) => s >= 70 ? '#34d399' : s >= 45 ? '#fbbf24' : '#f87171';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">DPDP Control Center</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Digital Personal Data Protection Act 2023 — compliance registers and readiness.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>Refresh</Button>
      </div>

      {/* DPDP Register weights */}
      <Card>
        <div className="font-semibold text-content mb-3 flex items-center gap-2">
          <Shield size={15} className="text-brand" /> Register Weights & Obligations
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {Object.entries(REGISTER_META).map(([k, v]) => (
            <div key={k} className="p-2.5 rounded-lg bg-surface-elev border border-border">
              <div className="font-semibold text-[12.5px] text-content">{v.label}</div>
              <div className="text-[11px] text-content-faint mt-0.5">{v.desc}</div>
              <div className="text-[11px] font-semibold text-brand mt-1.5">Weight: {v.weight}%</div>
            </div>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-48 bg-surface-elev rounded-lg animate-pulse" />)}</div>
      ) : clientDpdp.length === 0 ? (
        <Card className="text-center py-12">
          <Shield size={32} className="mx-auto mb-3 text-content-faint opacity-40" />
          <div className="text-content-faint">No clients to show DPDP readiness for.</div>
        </Card>
      ) : (
        clientDpdp.map(({ client, readiness }) => (
          <Card key={client.id} noPad>
            <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
              <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-content">{client.name}</div>
                <div className="text-[12px] text-content-faint">{client.industry} · {client.riskBand} Risk</div>
              </div>

              {/* Score ring */}
              <div className="flex items-center gap-3">
                <div
                  className="ring flex-shrink-0"
                  style={{ '--p': readiness.score, '--c': scoreColor(readiness.score), width: 52, height: 52 } as React.CSSProperties}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-panel flex items-center justify-center mx-auto mt-1 ml-1">
                    <span className="text-[13px] font-bold text-content">{readiness.score}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-content">DPDP Score</div>
                  {readiness.gaps.length > 0 ? (
                    <div className="text-[11px] text-red-400">{readiness.gaps.length} gaps</div>
                  ) : (
                    <div className="text-[11px] text-green-400">All registers active</div>
                  )}
                </div>
              </div>
            </div>

            {/* Registers grid */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {Object.entries(REGISTER_META).map(([k, v]) => {
                const reg = readiness.registers.find((r) => r.registerType === k);
                const status = reg?.status || 'GAP';
                const isActive = status === 'ACTIVE';
                const key = `${client.id}-${k}`;
                return (
                  <button
                    key={k}
                    onClick={() => toggleRegister(client.id, k, status)}
                    disabled={updating === key}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isActive ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/20 bg-red-500/5 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-semibold text-content">{v.label}</span>
                      {updating === key ? (
                        <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                      ) : isActive ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <AlertTriangle size={14} className="text-red-400" />
                      )}
                    </div>
                    <div className="text-[10.5px] text-content-faint">{v.desc}</div>
                    <div className={`text-[10.5px] font-semibold mt-1.5 ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {isActive ? '✓ Active' : '⚠ Gap — click to mark active'}
                    </div>
                  </button>
                );
              })}
            </div>

            {readiness.gaps.length > 0 && (
              <div className="px-4 pb-4">
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="font-semibold text-amber-400 text-[12.5px] mb-1.5">Gaps to remediate:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {readiness.gaps.map((g) => (
                      <Badge key={g} color="amber">{REGISTER_META[g]?.label || g}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
