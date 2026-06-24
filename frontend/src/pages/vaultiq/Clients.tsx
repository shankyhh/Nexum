import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import api from '../../lib/api';
import { formatDate, getRiskBg, SERVICES, INDUSTRIES, JURISDICTIONS } from '../../lib/utils';
import type { VaultClient, RiskProfile } from '../../types';

interface OnboardForm {
  name: string; gstin: string; cin: string; pan: string;
  industry: string; employees: number; jurisdiction: string; website: string;
  engagementStart: string; engagementEnd: string;
}

export default function Clients() {
  const [clients, setClients] = useState<VaultClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [inferredProfile, setInferredProfile] = useState<RiskProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<VaultClient | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<OnboardForm>({
    defaultValues: { industry: 'Technology', jurisdiction: 'Karnataka', employees: 10 },
  });

  const industry = watch('industry');
  const employees = watch('employees');

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await api.get('/vaultiq/clients');
      setClients(res.data.data || []);
    } finally { setLoading(false); }
  }

  async function inferRisk() {
    if (selectedServices.length === 0) return;
    try {
      const res = await api.post('/vaultiq/clients/infer-risk', {
        services: selectedServices, industry, employees: Number(employees),
      });
      setInferredProfile(res.data.data);
    } catch {}
  }

  function toggleService(s: string) {
    setSelectedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setInferredProfile(null);
  }

  async function onSubmit(data: OnboardForm) {
    if (selectedServices.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/vaultiq/clients', { ...data, services: selectedServices, employees: Number(data.employees) });
      setShowModal(false);
      setSelectedServices([]);
      setInferredProfile(null);
      loadClients();
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-content tracking-tight">Clients & Onboarding</h1>
          <p className="text-content-dim text-[13.5px] mt-1">Every engagement spins up a governed vault with AI-generated blueprints.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New Engagement</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-48 bg-surface-elev rounded-lg animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <Card className="text-center py-16">
          <Users size={40} className="mx-auto mb-3 text-content-faint opacity-40" />
          <div className="font-semibold text-content mb-1">No client engagements yet</div>
          <div className="text-content-faint text-[13px] mb-4">Create your first engagement to start the VAULTIQ lifecycle.</div>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New Engagement</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Card key={c.id} hover onClick={() => setSelectedClient(c)} className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[13.5px] text-content leading-tight">{c.name}</div>
                    <div className="text-[11.5px] text-content-faint">{c.industry} · {c.employees} staff</div>
                  </div>
                </div>
                <Badge color={c.status === 'ACTIVE' ? 'green' : c.status === 'CLOSING' ? 'amber' : 'default'} dot>{c.status}</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {c.services.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-surface-elev2 text-content-dim border border-border">{s}</span>
                ))}
                {c.services.length > 3 && (
                  <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-surface-elev2 text-content-dim border border-border">+{c.services.length - 3}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-[12px]">
                <div>
                  <div className="text-content-faint mb-0.5">Risk</div>
                  <div className={`font-semibold ${getRiskBg(c.riskBand).split(' ')[1]}`}>{c.riskScore} · {c.riskBand}</div>
                </div>
                <div>
                  <div className="text-content-faint mb-0.5">Assets</div>
                  <div className="font-bold text-content">{c._count?.dataAssets ?? 0}</div>
                </div>
                <div>
                  <div className="text-content-faint mb-0.5">DPDP</div>
                  <div className="font-bold" style={{ color: (c.dpdpScore||0) >= 70 ? '#34d399' : (c.dpdpScore||0) >= 45 ? '#fbbf24' : '#f87171' }}>
                    {c.dpdpScore ?? 0}/100
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Onboarding modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedServices([]); setInferredProfile(null); }}
        title="Client Onboarding Engine"
        subtitle="Enter engagement details — AI infers risk, data profile & DPDP obligations"
        size="xl"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit(onSubmit)}>Create Engagement</Button>
        </>}
      >
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" {...register('name', { required: true })} placeholder="e.g. Helios Pharma Ltd" required />
            <Select label="Industry" {...register('industry')} required>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </Select>
            <Input label="GSTIN" {...register('gstin')} placeholder="29ABCDE1234F1Z5" />
            <Input label="CIN" {...register('cin')} placeholder="U27100KA2012PLC065432" />
            <Input label="PAN" {...register('pan')} placeholder="ABCDE1234F" />
            <Input label="No. of Employees" type="number" {...register('employees')} />
            <Select label="Jurisdiction" {...register('jurisdiction')}>
              {JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}
            </Select>
            <Input label="Website" {...register('website')} placeholder="company.in" />
            <Input label="Engagement Start" type="date" {...register('engagementStart')} />
            <Input label="Engagement End" type="date" {...register('engagementEnd')} />
          </div>

          {/* Services */}
          <div>
            <div className="text-xs font-semibold text-content-dim mb-2">Services <span className="text-red-400">*</span></div>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${
                    selectedServices.includes(s) ? 'bg-brand/10 border-brand text-content' : 'border-border bg-surface-elev text-content-dim hover:border-brand/50'
                  }`}
                >
                  {selectedServices.includes(s) && <span className="text-brand mr-1">✓</span>}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Infer risk */}
          {selectedServices.length > 0 && (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={inferRisk}>
                ✦ Infer Risk Profile & DPDP Obligations
              </Button>
            </div>
          )}

          {/* Risk profile result */}
          {inferredProfile && (
            <div className="p-4 rounded-lg border border-border bg-surface-elev space-y-3">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg font-bold text-[15px] border ${getRiskBg(inferredProfile.riskBand)}`}>
                  {inferredProfile.riskScore}
                </div>
                <div>
                  <div className="font-semibold text-content">{inferredProfile.riskBand} Risk Client</div>
                  <div className="text-[12px] text-content-faint">{inferredProfile.sdpCount} sensitive data categories identified</div>
                </div>
              </div>
              <div>
                <div className="text-[11.5px] font-semibold text-content-dim mb-1.5">Data Categories:</div>
                <div className="flex flex-wrap gap-1.5">
                  {inferredProfile.dataCategories.map((c) => (
                    <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-base border border-border text-content-dim">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] font-semibold text-content-dim mb-1.5">DPDP Obligations:</div>
                <ul className="space-y-1">
                  {inferredProfile.obligations.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-[12px] text-content-dim">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Client detail modal */}
      {selectedClient && (
        <Modal
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={selectedClient.name}
          subtitle={`${selectedClient.industry} · ${selectedClient.employees} employees · ${selectedClient.jurisdiction}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface-elev border border-border text-center">
                <div className="text-[11px] text-content-faint">Risk Score</div>
                <div className={`text-[22px] font-bold mt-1 ${getRiskBg(selectedClient.riskBand).split(' ')[1]}`}>{selectedClient.riskScore}</div>
                <div className="text-[11px] text-content-faint">{selectedClient.riskBand}</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-elev border border-border text-center">
                <div className="text-[11px] text-content-faint">Data Assets</div>
                <div className="text-[22px] font-bold text-content mt-1">{selectedClient._count?.dataAssets ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-elev border border-border text-center">
                <div className="text-[11px] text-content-faint">DPDP Score</div>
                <div className="text-[22px] font-bold mt-1" style={{ color: (selectedClient.dpdpScore||0) >= 70 ? '#34d399' : '#fbbf24' }}>
                  {selectedClient.dpdpScore ?? 0}/100
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold text-content-dim mb-2">Services</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedClient.services.map((s) => (
                  <span key={s} className="text-[11.5px] px-2.5 py-1 rounded-md bg-brand/10 text-brand border border-brand/20 font-medium">{s}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold text-content-dim mb-2">Data Categories</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedClient.dataCategories?.map((c) => (
                  <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-elev2 border border-border text-content-dim">{c}</span>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              {[
                ['GSTIN', selectedClient.gstin], ['PAN', selectedClient.pan],
                ['CIN', selectedClient.cin], ['Jurisdiction', selectedClient.jurisdiction],
                ['Created', formatDate(selectedClient.createdAt)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex gap-2">
                  <dt className="text-content-faint">{k}:</dt>
                  <dd className="font-medium text-content">{v as string}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
}
