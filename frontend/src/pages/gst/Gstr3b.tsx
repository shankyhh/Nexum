import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calculator, Save, Send, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface Gstr3bForm {
  gstin: string;
  period: string;
  // 3.1 Outward taxable supplies
  outTaxable: number; outTaxableIgst: number; outTaxableCgst: number; outTaxableSgst: number;
  outZeroRated: number;
  outExempt: number;
  outNilRated: number;
  // 4 ITC
  itcIgst: number; itcCgst: number; itcSgst: number;
  itcRevRule42: number; itcRevRule43: number; itcRevOthers: number;
  // Advance tax
  advanceTaxPaid: number;
}

interface TaxSummary {
  totalLiability: number; itcAvailable: number; itcReversed: number; netItc: number; taxPayable: number;
}

export default function Gstr3b() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [saving, setSaving] = useState(false);
  const [filing, setFiling] = useState(false);
  const [returnId, setReturnId] = useState<string | undefined>(isNew ? undefined : id);
  const [status, setStatus] = useState<string>('DRAFT');
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);

  const { register, getValues, setValue } = useForm<Gstr3bForm>({
    defaultValues: {
      gstin: user?.gstin || '', period: new Date().toISOString().slice(0, 7),
      outTaxable: 0, outTaxableIgst: 0, outTaxableCgst: 0, outTaxableSgst: 0,
      outZeroRated: 0, outExempt: 0, outNilRated: 0,
      itcIgst: 0, itcCgst: 0, itcSgst: 0,
      itcRevRule42: 0, itcRevRule43: 0, itcRevOthers: 0,
      advanceTaxPaid: 0,
    },
  });

  useEffect(() => {
    if (!isNew && id) loadReturn(id);
  }, [id]);

  async function loadReturn(retId: string) {
    try {
      const res = await api.get(`/gst/${retId}`);
      const ret = res.data.data;
      setStatus(ret.status);
      const d = ret.data as Gstr3bForm;
      Object.keys(d).forEach((k) => setValue(k as keyof Gstr3bForm, (d as Record<string, unknown>)[k] as never));
    } catch {}
  }

  async function calculate() {
    const d = getValues();
    const payload = {
      type: 'GSTR3B',
      data: {
        outwardSupplies: { igst: d.outTaxableIgst, cgst: d.outTaxableCgst, sgst: d.outTaxableSgst, taxableValue: d.outTaxable, cess: 0 },
        itcEligible: { igst: d.itcIgst, cgst: d.itcCgst, sgst: d.itcSgst, cess: 0 },
        itcReversed: { rule42: d.itcRevRule42, rule43: d.itcRevRule43, others: d.itcRevOthers },
      },
    };
    try {
      const res = await api.post('/gst/calculate', payload);
      setTaxSummary(res.data.data);
    } catch {}
  }

  async function saveDraft() {
    setSaving(true);
    const d = getValues();
    try {
      if (!returnId) {
        const res = await api.post('/gst', { gstin: d.gstin, period: d.period, returnType: 'GSTR3B', data: d });
        setReturnId(res.data.data.id);
        navigate(`/gst/gstr3b/${res.data.data.id}`, { replace: true });
      } else {
        await api.put(`/gst/${returnId}`, { data: d });
      }
    } finally { setSaving(false); }
  }

  async function fileReturn() {
    if (!returnId) await saveDraft();
    setFiling(true);
    try {
      await api.post(`/gst/${returnId}/file`);
      setStatus('FILED');
    } finally { setFiling(false); }
  }

  const isFiled = status === 'FILED';
  const numField = (name: keyof Gstr3bForm, label: string) => (
    <div>
      <label className="block text-xs font-semibold text-content-dim mb-1.5">{label}</label>
      <input type="number" step="0.01" {...register(name, { valueAsNumber: true })} disabled={isFiled}
        className="w-full bg-surface-elev border border-border rounded-md px-3 py-2 text-[13px] text-content outline-none focus:border-brand disabled:opacity-60" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/gst')}>Back</Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-content">GSTR-3B</h1>
              <Badge color={status === 'FILED' ? 'green' : 'default'} dot>{status}</Badge>
            </div>
            <p className="text-content-dim text-[13px]">Monthly Summary Return — Tax Payable & ITC</p>
          </div>
        </div>
        {!isFiled && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Calculator size={14} />} onClick={calculate}>Calculate</Button>
            <Button variant="secondary" icon={<Save size={14} />} loading={saving} onClick={saveDraft}>Save Draft</Button>
            <Button variant="primary" icon={<Send size={14} />} loading={filing} onClick={fileReturn}>File Return</Button>
          </div>
        )}
      </div>

      {/* Period */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="GSTIN" {...register('gstin')} placeholder="29ABCDE1234F1Z5" disabled={isFiled} />
          <Input label="Period (YYYY-MM)" {...register('period')} placeholder="2024-04" disabled={isFiled} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 3.1 */}
        <Card>
          <div className="font-semibold text-content mb-4 pb-2 border-b border-border">
            3.1 — Outward Taxable Supplies
          </div>
          <div className="space-y-3">
            {numField('outTaxable', 'Taxable Value (₹)')}
            <div className="grid grid-cols-3 gap-3">
              {numField('outTaxableIgst', 'IGST (₹)')}
              {numField('outTaxableCgst', 'CGST (₹)')}
              {numField('outTaxableSgst', 'SGST (₹)')}
            </div>
            {numField('outZeroRated', 'Zero Rated Supplies (₹)')}
            {numField('outExempt', 'Exempt Supplies (₹)')}
          </div>
        </Card>

        {/* Section 4 ITC */}
        <Card>
          <div className="font-semibold text-content mb-4 pb-2 border-b border-border">
            4 — ITC Eligible / Reversed
          </div>
          <div className="space-y-3">
            <div className="text-[11.5px] font-semibold text-content-dim mb-1">ITC Available</div>
            <div className="grid grid-cols-3 gap-3">
              {numField('itcIgst', 'IGST (₹)')}
              {numField('itcCgst', 'CGST (₹)')}
              {numField('itcSgst', 'SGST (₹)')}
            </div>
            <div className="text-[11.5px] font-semibold text-content-dim mt-2 mb-1">ITC Reversed</div>
            <div className="grid grid-cols-3 gap-3">
              {numField('itcRevRule42', 'Rule 42 (₹)')}
              {numField('itcRevRule43', 'Rule 43 (₹)')}
              {numField('itcRevOthers', 'Others (₹)')}
            </div>
          </div>
        </Card>
      </div>

      {/* Tax summary */}
      {taxSummary && (
        <Card className="border-brand/30 bg-brand/5">
          <div className="font-semibold text-content mb-4">Tax Computation Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Liability', value: taxSummary.totalLiability, color: 'text-red-400' },
              { label: 'ITC Available', value: taxSummary.itcAvailable, color: 'text-green-400' },
              { label: 'ITC Reversed', value: taxSummary.itcReversed, color: 'text-amber-400' },
              { label: 'Net ITC', value: taxSummary.netItc, color: 'text-blue-400' },
              { label: 'Tax Payable', value: taxSummary.taxPayable, color: 'text-brand font-bold' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-surface-panel border border-border">
                <div className="text-[11px] text-content-faint mb-1">{s.label}</div>
                <div className={`text-[17px] font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-surface-elev border border-border text-[12.5px] text-content-dim">
            <span className="text-amber-400 font-semibold">Note: </span>
            Tax payable = Total liability − Net ITC. Pay via challan on the GST portal before filing deadline.
          </div>
        </Card>
      )}
    </div>
  );
}
