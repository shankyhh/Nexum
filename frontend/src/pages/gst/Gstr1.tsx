import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Calculator, Send, Save, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface B2BRow { buyerGstin: string; buyerName: string; invoiceNo: string; invoiceDate: string; taxableValue: number; igst: number; cgst: number; sgst: number; }
interface B2CRow { invoiceNo: string; invoiceDate: string; taxableValue: number; rate: number; igst: number; cgst: number; sgst: number; }

interface FormData {
  gstin: string;
  period: string;
  b2b: B2BRow[];
  b2c: B2CRow[];
}

export default function Gstr1() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [tab, setTab] = useState<'b2b' | 'b2c' | 'hsn'>('b2b');
  const [saving, setSaving] = useState(false);
  const [filing, setFiling] = useState(false);
  const [returnId, setReturnId] = useState<string | undefined>(isNew ? undefined : id);
  const [status, setStatus] = useState<string>('DRAFT');
  const [taxCalc, setTaxCalc] = useState<{ totalTaxableValue: number; totalTax: number; totalIgst: number; totalCgst: number; totalSgst: number } | null>(null);

  const { register, control, handleSubmit, watch, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      gstin: user?.gstin || '',
      period: new Date().toISOString().slice(0, 7),
      b2b: [{ buyerGstin: '', buyerName: '', invoiceNo: '', invoiceDate: '', taxableValue: 0, igst: 0, cgst: 0, sgst: 0 }],
      b2c: [{ invoiceNo: '', invoiceDate: '', taxableValue: 0, rate: 18, igst: 0, cgst: 0, sgst: 0 }],
    },
  });

  const { fields: b2bFields, append: addB2B, remove: removeB2B } = useFieldArray({ control, name: 'b2b' });
  const { fields: b2cFields, append: addB2C, remove: removeB2C } = useFieldArray({ control, name: 'b2c' });

  useEffect(() => {
    if (!isNew && id) loadReturn(id);
  }, [id]);

  async function loadReturn(retId: string) {
    try {
      const res = await api.get(`/gst/${retId}`);
      const ret = res.data.data;
      setStatus(ret.status);
      const d = ret.data as FormData;
      if (d.gstin) setValue('gstin', d.gstin);
      if (d.period) setValue('period', d.period);
      if (d.b2b?.length) setValue('b2b', d.b2b);
      if (d.b2c?.length) setValue('b2c', d.b2c);
    } catch {}
  }

  async function calculate() {
    const data = getValues();
    try {
      const res = await api.post('/gst/calculate', { type: 'GSTR1', data });
      setTaxCalc(res.data.data);
    } catch {}
  }

  async function saveDraft() {
    setSaving(true);
    const data = getValues();
    try {
      if (!returnId) {
        const res = await api.post('/gst', { gstin: data.gstin, period: data.period, returnType: 'GSTR1', data });
        setReturnId(res.data.data.id);
        navigate(`/gst/gstr1/${res.data.data.id}`, { replace: true });
      } else {
        await api.put(`/gst/${returnId}`, { data });
      }
    } finally {
      setSaving(false);
    }
  }

  async function fileReturn() {
    if (!returnId) await saveDraft();
    setFiling(true);
    try {
      await api.post(`/gst/${returnId}/file`);
      setStatus('FILED');
    } finally {
      setFiling(false);
    }
  }

  const isFiled = status === 'FILED';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/gst')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-content">GSTR-1</h1>
              <Badge color={status === 'FILED' ? 'green' : status === 'PENDING' ? 'amber' : 'default'} dot>
                {status}
              </Badge>
            </div>
            <p className="text-content-dim text-[13px]">Outward Supplies Statement — B2B, B2C, HSN Summary</p>
          </div>
        </div>
        {!isFiled && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Calculator size={14} />} onClick={calculate}>Calculate Tax</Button>
            <Button variant="secondary" icon={<Save size={14} />} loading={saving} onClick={saveDraft}>Save Draft</Button>
            <Button variant="primary" icon={<Send size={14} />} loading={filing} onClick={fileReturn}>File Return</Button>
          </div>
        )}
      </div>

      {/* Header fields */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="GSTIN" {...register('gstin')} placeholder="29ABCDE1234F1Z5" disabled={isFiled} />
          <Input label="Period (YYYY-MM)" {...register('period')} placeholder="2024-04" disabled={isFiled} />
          <div className="col-span-2 flex items-end">
            {taxCalc && (
              <div className="flex gap-6 p-3 rounded-lg bg-brand/5 border border-brand/20 w-full">
                <div><div className="text-[11px] text-content-faint">Taxable Value</div><div className="font-bold text-content">{formatCurrency(taxCalc.totalTaxableValue)}</div></div>
                <div><div className="text-[11px] text-content-faint">Total Tax</div><div className="font-bold text-brand">{formatCurrency(taxCalc.totalTax)}</div></div>
                <div><div className="text-[11px] text-content-faint">IGST</div><div className="font-semibold text-content">{formatCurrency(taxCalc.totalIgst)}</div></div>
                <div><div className="text-[11px] text-content-faint">CGST</div><div className="font-semibold text-content">{formatCurrency(taxCalc.totalCgst)}</div></div>
                <div><div className="text-[11px] text-content-faint">SGST</div><div className="font-semibold text-content">{formatCurrency(taxCalc.totalSgst)}</div></div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ id: 'b2b', label: 'B2B Supplies' }, { id: 'b2c', label: 'B2C Supplies' }, { id: 'hsn', label: 'HSN Summary' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-content-dim hover:text-content'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* B2B */}
      {tab === 'b2b' && (
        <Card noPad>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-content text-[13px]">B2B Invoices ({b2bFields.length})</span>
            {!isFiled && (
              <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => addB2B({ buyerGstin: '', buyerName: '', invoiceNo: '', invoiceDate: '', taxableValue: 0, igst: 0, cgst: 0, sgst: 0 })}>
                Add Row
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-surface-elev">
                  {['Buyer GSTIN', 'Buyer Name', 'Invoice No', 'Date', 'Taxable Value', 'IGST', 'CGST', 'SGST', ''].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-content-faint font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b2bFields.map((field, i) => (
                  <tr key={field.id} className="border-b border-border/50 hover:bg-surface-elev/50">
                    {(['buyerGstin', 'buyerName', 'invoiceNo'] as const).map((f) => (
                      <td key={f} className="px-2 py-1.5">
                        <input {...register(`b2b.${i}.${f}`)} disabled={isFiled} placeholder={f === 'buyerGstin' ? '29AAA...' : ''} className="w-full bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60 placeholder:text-content-faint min-w-[100px]" />
                      </td>
                    ))}
                    <td className="px-2 py-1.5"><input type="date" {...register(`b2b.${i}.invoiceDate`)} disabled={isFiled} className="w-full bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60" /></td>
                    {(['taxableValue', 'igst', 'cgst', 'sgst'] as const).map((f) => (
                      <td key={f} className="px-2 py-1.5">
                        <input type="number" {...register(`b2b.${i}.${f}`, { valueAsNumber: true })} disabled={isFiled} className="w-24 bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60" />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      {!isFiled && <button onClick={() => removeB2B(i)} className="text-content-faint hover:text-red-400"><Trash2 size={13} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* B2C */}
      {tab === 'b2c' && (
        <Card noPad>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-content text-[13px]">B2C Invoices ({b2cFields.length})</span>
            {!isFiled && (
              <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => addB2C({ invoiceNo: '', invoiceDate: '', taxableValue: 0, rate: 18, igst: 0, cgst: 0, sgst: 0 })}>
                Add Row
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-surface-elev">
                  {['Invoice No', 'Date', 'Taxable Value', 'Rate %', 'IGST', 'CGST', 'SGST', ''].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-content-faint font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b2cFields.map((field, i) => (
                  <tr key={field.id} className="border-b border-border/50 hover:bg-surface-elev/50">
                    <td className="px-2 py-1.5"><input {...register(`b2c.${i}.invoiceNo`)} disabled={isFiled} className="w-28 bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60" /></td>
                    <td className="px-2 py-1.5"><input type="date" {...register(`b2c.${i}.invoiceDate`)} disabled={isFiled} className="w-full bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60" /></td>
                    {(['taxableValue', 'rate', 'igst', 'cgst', 'sgst'] as const).map((f) => (
                      <td key={f} className="px-2 py-1.5">
                        <input type="number" {...register(`b2c.${i}.${f}`, { valueAsNumber: true })} disabled={isFiled} className="w-20 bg-surface-base border border-border rounded px-2 py-1.5 text-content outline-none focus:border-brand disabled:opacity-60" />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      {!isFiled && <button onClick={() => removeB2C(i)} className="text-content-faint hover:text-red-400"><Trash2 size={13} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* HSN placeholder */}
      {tab === 'hsn' && (
        <Card>
          <div className="text-center py-8 text-content-faint">
            <div className="text-3xl mb-3">📦</div>
            <div className="font-semibold text-content mb-1">HSN Summary (Auto-computed)</div>
            <div className="text-[13px]">HSN summary is auto-generated from B2B & B2C invoices on filing.</div>
          </div>
        </Card>
      )}
    </div>
  );
}
