import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Send, Calculator, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface CapGain { assetType: string; purchaseDate: string; saleDate: string; costOfAcquisition: number; saleConsideration: number; type: 'STCG' | 'LTCG'; }
interface Itr2Form {
  pan: string; assessmentYear: string; name: string;
  grossSalary: number; standardDeduction: number; otherIncome: number; foreignIncome: number;
  section80C: number; section80D: number;
  capitalGains: CapGain[];
  immovableProperty: number; movableProperty: number; financialAssets: number; liabilities: number;
  tdsDeducted: number; advanceTax: number;
}

export default function Itr2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [tab, setTab] = useState<'personal' | 'income' | 'cg' | 'deductions' | 'assets' | 'tax'>('personal');
  const [saving, setSaving] = useState(false);
  const [filing, setFiling] = useState(false);
  const [returnId, setReturnId] = useState<string | undefined>(isNew ? undefined : id);
  const [status, setStatus] = useState('DRAFT');
  const [taxResult, setTaxResult] = useState<Record<string, number> | null>(null);

  const { register, control, getValues, setValue } = useForm<Itr2Form>({
    defaultValues: {
      pan: user?.pan || '', assessmentYear: '2025-26', name: user?.name || '',
      grossSalary: 0, standardDeduction: 50000, otherIncome: 0, foreignIncome: 0,
      section80C: 0, section80D: 0,
      capitalGains: [{ assetType: 'Equity Shares', purchaseDate: '', saleDate: '', costOfAcquisition: 0, saleConsideration: 0, type: 'STCG' }],
      immovableProperty: 0, movableProperty: 0, financialAssets: 0, liabilities: 0,
      tdsDeducted: 0, advanceTax: 0,
    },
  });

  const { fields: cgFields, append: addCg, remove: removeCg } = useFieldArray({ control, name: 'capitalGains' });
  const isFiled = status === 'FILED';

  async function calculate() {
    const d = getValues();
    const netSalary = d.grossSalary - d.standardDeduction;
    const payload = {
      pan: d.pan, assessmentYear: d.assessmentYear, name: d.name, dob: '', residentialStatus: 'ROR',
      salary: [{ grossSalary: d.grossSalary, hra: 0, lta: 0, otherAllowances: 0, standardDeduction: d.standardDeduction, employerName: '', employerTan: '', netSalary }],
      houseProperty: [], otherIncome: d.otherIncome, foreignIncome: d.foreignIncome,
      capitalGains: d.capitalGains.map((g) => ({ ...g, gain: g.saleConsideration - g.costOfAcquisition })),
      deductions: { section80C: d.section80C, section80D: d.section80D, section80G: 0, section80TTA: 0, section80EE: 0, section80CCC: 0 },
    };
    try {
      const res = await api.post('/itr/calculate', payload);
      setTaxResult(res.data.data);
    } catch {}
  }

  async function saveDraft() {
    setSaving(true);
    const d = getValues();
    try {
      if (!returnId) {
        const res = await api.post('/itr', { pan: d.pan, assessmentYear: d.assessmentYear, returnType: 'ITR2', data: d });
        setReturnId(res.data.data.id);
        navigate(`/itr/itr2/${res.data.data.id}`, { replace: true });
      } else {
        await api.put(`/itr/${returnId}`, { data: d });
      }
    } finally { setSaving(false); }
  }

  async function fileReturn() {
    if (!returnId) await saveDraft();
    setFiling(true);
    try {
      await api.post(`/itr/${returnId}/file`);
      setStatus('FILED');
    } finally { setFiling(false); }
  }

  const numFld = (name: keyof Itr2Form, label: string) => (
    <div>
      <label className="block text-xs font-semibold text-content-dim mb-1.5">{label}</label>
      <input type="number" step="0.01" {...register(name, { valueAsNumber: true })} disabled={isFiled}
        className="w-full bg-surface-elev border border-border rounded-md px-3 py-2 text-[13px] text-content outline-none focus:border-brand disabled:opacity-60" />
    </div>
  );
  const txtFld = (name: keyof Itr2Form, label: string, placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-content-dim mb-1.5">{label}</label>
      <input {...register(name)} disabled={isFiled} placeholder={placeholder}
        className="w-full bg-surface-elev border border-border rounded-md px-3 py-2 text-[13px] text-content outline-none focus:border-brand disabled:opacity-60" />
    </div>
  );

  const tabs = [
    { id: 'personal', label: 'Personal' }, { id: 'income', label: 'Income' },
    { id: 'cg', label: 'Capital Gains' }, { id: 'deductions', label: 'Deductions' },
    { id: 'assets', label: 'Schedule AL' }, { id: 'tax', label: 'Tax Computation' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/itr')}>Back</Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-content">ITR-2</h1>
              <Badge color={status === 'FILED' ? 'green' : 'default'} dot>{status}</Badge>
            </div>
            <p className="text-content-dim text-[13px]">Income Tax Return — Capital Gains & Foreign Income — AY 2025-26</p>
          </div>
        </div>
        {!isFiled && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Calculator size={14} />} onClick={calculate}>Calculate</Button>
            <Button variant="secondary" icon={<Save size={14} />} loading={saving} onClick={saveDraft}>Save Draft</Button>
            <Button variant="primary" icon={<Send size={14} />} loading={filing} onClick={fileReturn}>File ITR</Button>
          </div>
        )}
      </div>

      <div className="flex gap-0.5 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-content-dim hover:text-content'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <Card><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {txtFld('pan', 'PAN', 'ABCDE1234F')}
          {txtFld('assessmentYear', 'Assessment Year', '2025-26')}
          {txtFld('name', 'Full Name')}
        </div></Card>
      )}

      {tab === 'income' && (
        <Card><div className="font-semibold text-content mb-4">Income Sources</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numFld('grossSalary', 'Gross Salary (₹)')}
          {numFld('standardDeduction', 'Standard Deduction (₹)')}
          {numFld('otherIncome', 'Other Income (₹)')}
          {numFld('foreignIncome', 'Foreign Income (₹)')}
        </div></Card>
      )}

      {tab === 'cg' && (
        <Card noPad>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-content text-[13px]">Capital Gains ({cgFields.length})</span>
            {!isFiled && (
              <Button size="sm" variant="secondary" icon={<Plus size={13} />}
                onClick={() => addCg({ assetType: '', purchaseDate: '', saleDate: '', costOfAcquisition: 0, saleConsideration: 0, type: 'STCG' })}>
                Add
              </Button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {cgFields.map((field, i) => (
              <div key={field.id} className="p-3 rounded-lg border border-border bg-surface-elev">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    {(['STCG', 'LTCG'] as const).map((t) => (
                      <label key={t} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border cursor-pointer transition-colors ${
                        field.type === t ? 'border-brand bg-brand/10 text-brand' : 'border-border text-content-faint'
                      }`}>
                        <input type="radio" {...register(`capitalGains.${i}.type`)} value={t} className="hidden" />{t}
                      </label>
                    ))}
                  </div>
                  {!isFiled && <button onClick={() => removeCg(i)} className="text-content-faint hover:text-red-400"><Trash2 size={14} /></button>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="block text-[11px] font-semibold text-content-dim mb-1">Asset Type</label>
                    <input {...register(`capitalGains.${i}.assetType`)} disabled={isFiled} placeholder="Equity Shares"
                      className="w-full bg-surface-base border border-border rounded px-2.5 py-1.5 text-[12.5px] text-content outline-none focus:border-brand" /></div>
                  <div><label className="block text-[11px] font-semibold text-content-dim mb-1">Purchase Date</label>
                    <input type="date" {...register(`capitalGains.${i}.purchaseDate`)} disabled={isFiled}
                      className="w-full bg-surface-base border border-border rounded px-2.5 py-1.5 text-[12.5px] text-content outline-none focus:border-brand" /></div>
                  <div><label className="block text-[11px] font-semibold text-content-dim mb-1">Sale Date</label>
                    <input type="date" {...register(`capitalGains.${i}.saleDate`)} disabled={isFiled}
                      className="w-full bg-surface-base border border-border rounded px-2.5 py-1.5 text-[12.5px] text-content outline-none focus:border-brand" /></div>
                  <div><label className="block text-[11px] font-semibold text-content-dim mb-1">Cost of Acquisition (₹)</label>
                    <input type="number" {...register(`capitalGains.${i}.costOfAcquisition`, { valueAsNumber: true })} disabled={isFiled}
                      className="w-full bg-surface-base border border-border rounded px-2.5 py-1.5 text-[12.5px] text-content outline-none focus:border-brand" /></div>
                  <div><label className="block text-[11px] font-semibold text-content-dim mb-1">Sale Consideration (₹)</label>
                    <input type="number" {...register(`capitalGains.${i}.saleConsideration`, { valueAsNumber: true })} disabled={isFiled}
                      className="w-full bg-surface-base border border-border rounded px-2.5 py-1.5 text-[12.5px] text-content outline-none focus:border-brand" /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3 text-[12px] text-content-faint">
            STCG on equity: 15% (§111A) · LTCG on equity above ₹1L: 10% (§112A) · LTCG on property: 20% with indexation (§112)
          </div>
        </Card>
      )}

      {tab === 'deductions' && (
        <Card><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numFld('section80C', '80C — LIC, PPF, ELSS (max ₹1,50,000)')}
          {numFld('section80D', '80D — Medical Insurance (max ₹25,000)')}
        </div></Card>
      )}

      {tab === 'assets' && (
        <Card>
          <div className="font-semibold text-content mb-1">Schedule AL — Assets and Liabilities</div>
          <p className="text-content-faint text-[12.5px] mb-4">Mandatory if total income exceeds ₹50 lakhs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numFld('immovableProperty', 'Immovable Property (₹)')}
            {numFld('movableProperty', 'Movable Property (₹)')}
            {numFld('financialAssets', 'Financial Assets (₹)')}
            {numFld('liabilities', 'Liabilities (₹)')}
          </div>
        </Card>
      )}

      {tab === 'tax' && (
        <div className="space-y-4">
          <Button variant="primary" icon={<Calculator size={14} />} onClick={calculate}>Compute Tax</Button>
          {taxResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Gross Total Income', value: taxResult.grossTotalIncome },
                { label: 'Net Taxable Income', value: taxResult.netTaxableIncome },
                { label: 'Total Tax', value: taxResult.totalTaxLiability },
                { label: 'Regime', value: taxResult.regime === 'NEW' ? '🆕 New' : '📋 Old', isText: true },
              ].map((s) => (
                <Card key={s.label}>
                  <div className="text-[11px] text-content-faint">{s.label}</div>
                  <div className="text-[18px] font-bold text-content mt-1">
                    {s.isText ? s.value : formatCurrency(s.value as number)}
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numFld('tdsDeducted', 'TDS Deducted (Form 26AS) (₹)')}
            {numFld('advanceTax', 'Advance Tax Paid (₹)')}
          </div>
        </div>
      )}
    </div>
  );
}
