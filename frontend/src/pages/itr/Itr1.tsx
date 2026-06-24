import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Send, Calculator, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
interface TaxComputation {
  grossTotalIncome: number; totalDeductions: number; netTaxableIncome: number;
  taxOldRegime: number; taxNewRegime: number; surcharge: number; cess: number;
  totalTaxLiability: number; tdsDeducted: number; advanceTax: number;
  regime: 'OLD' | 'NEW';
}

interface Itr1Form {
  pan: string; assessmentYear: string; name: string; dob: string; aadhaar: string;
  grossSalary: number; hra: number; lta: number; standardDeduction: number;
  annualRent: number; municipalTax: number; interestOnLoan: number;
  otherIncome: number;
  section80C: number; section80D: number; section80G: number; section80TTA: number; section80EE: number;
  tdsDeducted: number; advanceTax: number;
}

export default function Itr1() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [tab, setTab] = useState<'personal' | 'salary' | 'hp' | 'other' | 'deductions' | 'tax'>('personal');
  const [saving, setSaving] = useState(false);
  const [filing, setFiling] = useState(false);
  const [returnId, setReturnId] = useState<string | undefined>(isNew ? undefined : id);
  const [status, setStatus] = useState('DRAFT');
  const [taxComp, setTaxComp] = useState<TaxComputation | null>(null);

  const { register, getValues, setValue } = useForm<Itr1Form>({
    defaultValues: {
      pan: user?.pan || '', assessmentYear: '2025-26', name: user?.name || '', dob: '',
      grossSalary: 0, hra: 0, lta: 0, standardDeduction: 50000,
      annualRent: 0, municipalTax: 0, interestOnLoan: 0,
      otherIncome: 0,
      section80C: 0, section80D: 0, section80G: 0, section80TTA: 0, section80EE: 0,
      tdsDeducted: 0, advanceTax: 0,
    },
  });

  useEffect(() => { if (!isNew && id) loadReturn(id); }, [id]);

  async function loadReturn(retId: string) {
    try {
      const res = await api.get(`/itr/${retId}`);
      const ret = res.data.data;
      setStatus(ret.status);
      const d = ret.data as Itr1Form;
      Object.keys(d).forEach((k) => setValue(k as keyof Itr1Form, (d as Record<string, unknown>)[k] as never));
    } catch {}
  }

  async function calculate() {
    const d = getValues();
    const netSalary = d.grossSalary - d.hra - d.lta - d.standardDeduction;
    const netHP = d.annualRent - d.municipalTax - (d.annualRent - d.municipalTax) * 0.3 - d.interestOnLoan;
    const payload = {
      pan: d.pan, assessmentYear: d.assessmentYear, name: d.name, dob: d.dob, residentialStatus: 'ROR',
      salary: [{ grossSalary: d.grossSalary, hra: d.hra, lta: d.lta, otherAllowances: 0, standardDeduction: d.standardDeduction, employerName: '', employerTan: '', netSalary }],
      houseProperty: [{ address: '', annualRent: d.annualRent, municipalTax: d.municipalTax, netAnnualValue: d.annualRent - d.municipalTax, standardDeduction30: (d.annualRent - d.municipalTax) * 0.3, interestOnLoan: d.interestOnLoan, netIncome: netHP }],
      otherIncome: d.otherIncome,
      deductions: { section80C: d.section80C, section80D: d.section80D, section80G: d.section80G, section80TTA: d.section80TTA, section80EE: d.section80EE, section80CCC: 0 },
    };
    try {
      const res = await api.post('/itr/calculate', payload);
      setTaxComp({ ...res.data.data, tdsDeducted: d.tdsDeducted, advanceTax: d.advanceTax });
    } catch {}
  }

  async function saveDraft() {
    setSaving(true);
    const d = getValues();
    try {
      if (!returnId) {
        const res = await api.post('/itr', { pan: d.pan, assessmentYear: d.assessmentYear, returnType: 'ITR1', data: d });
        setReturnId(res.data.data.id);
        navigate(`/itr/itr1/${res.data.data.id}`, { replace: true });
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

  const isFiled = status === 'FILED';
  const tabs = [
    { id: 'personal', label: 'Personal Details' },
    { id: 'salary', label: 'Salary Income' },
    { id: 'hp', label: 'House Property' },
    { id: 'other', label: 'Other Income' },
    { id: 'deductions', label: 'Deductions' },
    { id: 'tax', label: 'Tax Computation' },
  ];

  const n = (name: keyof Itr1Form, label: string, placeholder = '0') => (
    <div>
      <label className="block text-xs font-semibold text-content-dim mb-1.5">{label}</label>
      <input type="number" step="0.01" {...register(name, { valueAsNumber: true })} disabled={isFiled} placeholder={placeholder}
        className="w-full bg-surface-elev border border-border rounded-md px-3 py-2 text-[13px] text-content outline-none focus:border-brand disabled:opacity-60" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/itr')}>Back</Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-content">ITR-1 (Sahaj)</h1>
              <Badge color={status === 'FILED' ? 'green' : 'default'} dot>{status}</Badge>
            </div>
            <p className="text-content-dim text-[13px]">Income Tax Return — AY 2025-26</p>
          </div>
        </div>
        {!isFiled && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Calculator size={14} />} onClick={calculate}>Calculate Tax</Button>
            <Button variant="secondary" icon={<Save size={14} />} loading={saving} onClick={saveDraft}>Save Draft</Button>
            <Button variant="primary" icon={<Send size={14} />} loading={filing} onClick={fileReturn}>File ITR</Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.id ? 'border-brand text-brand' : 'border-transparent text-content-dim hover:text-content'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="PAN" {...register('pan')} placeholder="ABCDE1234F" disabled={isFiled} />
            <Input label="Assessment Year" {...register('assessmentYear')} placeholder="2025-26" disabled={isFiled} />
            <Input label="Full Name" {...register('name')} disabled={isFiled} />
            <Input label="Date of Birth" {...register('dob')} type="date" disabled={isFiled} />
            <Input label="Aadhaar (optional)" {...register('aadhaar')} placeholder="XXXX XXXX XXXX" disabled={isFiled} />
          </div>
        </Card>
      )}

      {tab === 'salary' && (
        <Card>
          <div className="font-semibold text-content mb-4">Income from Salary (Section 17)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {n('grossSalary', 'Gross Salary (₹)')}
            {n('hra', 'HRA Exemption (₹) — §10(13A)')}
            {n('lta', 'LTA Exemption (₹) — §10(5)')}
            {n('standardDeduction', 'Standard Deduction (₹) — §16(ia)', '50000')}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-surface-elev border border-border text-[12.5px] text-content-dim">
            <span className="text-green-400 font-semibold">Net Salary = </span>
            Gross − HRA − LTA − Standard Deduction (default ₹50,000)
          </div>
        </Card>
      )}

      {tab === 'hp' && (
        <Card>
          <div className="font-semibold text-content mb-4">Income from House Property (Section 24)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {n('annualRent', 'Annual Rental Income (₹)')}
            {n('municipalTax', 'Municipal Tax Paid (₹)')}
            {n('interestOnLoan', 'Interest on Home Loan (₹) — §24(b)')}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-surface-elev border border-border text-[12.5px] text-content-dim">
            30% standard deduction auto-applied on Net Annual Value (§24(a)).
            Home loan interest capped at ₹2L for self-occupied property.
          </div>
        </Card>
      )}

      {tab === 'other' && (
        <Card>
          <div className="font-semibold text-content mb-4">Other Income (Section 56)</div>
          <div className="max-w-sm">{n('otherIncome', 'Other Income (₹) — interest, gifts, etc.')}</div>
        </Card>
      )}

      {tab === 'deductions' && (
        <Card>
          <div className="font-semibold text-content mb-4">Chapter VI-A Deductions</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {n('section80C', '80C — LIC, PPF, ELSS, EPF (max ₹1,50,000)')}
            {n('section80D', '80D — Medical Insurance (max ₹25,000)')}
            {n('section80G', '80G — Donations (50%/100%)')}
            {n('section80TTA', '80TTA — Savings Interest (max ₹10,000)')}
            {n('section80EE', '80EE — Home Loan Interest (max ₹50,000)')}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[12.5px] text-content-dim">
            <span className="text-amber-400 font-semibold">Note: </span>
            Deductions under Chapter VI-A are available only under the Old Tax Regime.
          </div>
        </Card>
      )}

      {tab === 'tax' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button variant="primary" icon={<Calculator size={14} />} onClick={calculate}>Compute Tax</Button>
          </div>
          {taxComp ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Gross Total Income', value: taxComp.grossTotalIncome },
                  { label: 'Total Deductions', value: taxComp.totalDeductions },
                  { label: 'Net Taxable Income', value: taxComp.netTaxableIncome },
                  { label: 'Total Tax Liability', value: taxComp.totalTaxLiability },
                ].map((s) => (
                  <Card key={s.label}>
                    <div className="text-[11px] text-content-faint">{s.label}</div>
                    <div className="text-[18px] font-bold text-content mt-1">{formatCurrency(s.value)}</div>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="font-semibold text-content mb-4">Regime Comparison</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Old Regime Tax', value: taxComp.taxOldRegime, recommended: taxComp.regime === 'OLD' },
                    { label: 'New Regime Tax', value: taxComp.taxNewRegime, recommended: taxComp.regime === 'NEW' },
                  ].map((r) => (
                    <div key={r.label} className={`p-4 rounded-lg border ${r.recommended ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-surface-elev'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-content">{r.label}</span>
                        {r.recommended && <Badge color="green">Recommended</Badge>}
                      </div>
                      <div className={`text-[24px] font-bold ${r.recommended ? 'text-green-400' : 'text-content'}`}>
                        {formatCurrency(r.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                  {[
                    { label: 'Surcharge', value: taxComp.surcharge },
                    { label: 'Health & Education Cess (4%)', value: taxComp.cess },
                    { label: 'TDS Deducted', value: taxComp.tdsDeducted },
                    { label: 'Advance Tax', value: taxComp.advanceTax },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="text-content-faint text-[11.5px]">{r.label}</div>
                      <div className="font-semibold text-content mt-1">{formatCurrency(r.value)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="font-semibold text-[15px] text-content">
                    {(taxComp.totalTaxLiability - taxComp.tdsDeducted - taxComp.advanceTax) > 0 ? 'Balance Tax Payable' : 'Refund Due'}
                  </span>
                  <span className={`text-[20px] font-bold ${(taxComp.totalTaxLiability - taxComp.tdsDeducted - taxComp.advanceTax) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(Math.abs(taxComp.totalTaxLiability - taxComp.tdsDeducted - taxComp.advanceTax))}
                  </span>
                </div>
              </Card>
            </div>
          ) : (
            <Card>
              <div className="text-center py-8 text-content-faint">
                <Calculator size={32} className="mx-auto mb-3 opacity-40" />
                <div>Click "Compute Tax" to see your tax liability and regime comparison.</div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {n('tdsDeducted', 'TDS Deducted (Form 16 / 26AS) (₹)')}
            {n('advanceTax', 'Advance Tax Paid (₹)')}
          </div>
        </div>
      )}
    </div>
  );
}
