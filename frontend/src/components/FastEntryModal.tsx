import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { X, Plus, Save, Loader2, Trash2, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FastEntryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  sectorTypes: any[];
  categories: any[];
  userRole?: string;
  userSectorUnitId?: number;
}

interface RowData {
  id: string;
  fullName: string;
  gender: string;
  grossSalary: string;
  tax: number;
  pension: number;
  netSalary: number;
  percentage: number;
  monthlyFee: number;
}

export default function FastEntryModal({ onClose, onSuccess, sectorTypes, categories, userRole, userSectorUnitId }: FastEntryModalProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Hierarchy selections
  const [selectedSectorType, setSelectedSectorType] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [employmentType, setEmploymentType] = useState('Government');
  const [sectors, setSectors] = useState<any[]>([]);

  const [rows, setRows] = useState<RowData[]>([createEmptyRow()]);
  const tableRef = useRef<HTMLDivElement>(null);

  function createEmptyRow(): RowData {
    return {
      id: Math.random().toString(36).substr(2, 9),
      fullName: '',
      gender: 'Male',
      grossSalary: '',
      tax: 0,
      pension: 0,
      netSalary: 0,
      percentage: 0,
      monthlyFee: 0
    };
  }

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data)).catch(console.error);
    if (userRole === 'sector_officer' && userSectorUnitId) {
      setSelectedSectorId(String(userSectorUnitId));
    }
  }, [userRole, userSectorUnitId]);

  useEffect(() => {
    if (selectedSectorType) {
      api.get(`/sectors?type=${selectedSectorType}`).then(res => setSectors(res.data));
    } else {
      setSectors([]);
    }
  }, [selectedSectorType]);
  
  useEffect(() => {
    if (selectedCategoryId && settings) {
      const newRows = rows.map(r => ({
        ...r,
        ...calculateRow(r.grossSalary, settings, employmentType)
      }));
      setRows(newRows);
    }
  }, [selectedCategoryId, employmentType, settings]);

  const calculateRow = (salaryStr: string, currentSettings: any, empType: string): Pick<RowData, 'tax'|'pension'|'netSalary'|'percentage'|'monthlyFee'> => {
    const gross = Number(salaryStr) || 0;
    
    // 1. Get Category Context
    const selectedCat = categories.find(c => String(c.id) === selectedCategoryId);
    const catName = selectedCat?.name.toLowerCase() || '';

    let monthlyFee = 0;
    let tax = 0;
    let pension = 0;
    let netSalary = 0;
    let percentage = 0;

    // 2. Specialized Tiers (Can work with 0 or string salary)
    if (catName.includes('wing')) {
      // Wing Tiers (Article 7 & 8)
      if (gross >= 1000) {
        if (gross <= 3000) monthlyFee = 2;
        else if (gross <= 5000) monthlyFee = 5;
        else if (gross <= 10000) monthlyFee = 10;
        else monthlyFee = 20;
      } else if (gross > 0) {
        monthlyFee = 1;
      } else {
        monthlyFee = 10; 
      }
    } else if (catName.includes('enterprise') || catName.includes('business')) {
      // Business Tiers: Micro (5), Small (10), Medium (20)
      const type = salaryStr.toLowerCase();
      if (type.includes('micro') || (gross > 0 && gross <= 50000)) monthlyFee = 5;
      else if (type.includes('small') || (gross > 50000 && gross <= 250000)) monthlyFee = 10;
      else if (type.includes('medium') || gross > 250000) monthlyFee = 20;
      else monthlyFee = 5; // Default to Micro if selected but 0 input
    } else if (catName.includes('investor')) {
      // Investor Tiers: 500, 1000, 2000
      if (gross <= 5000000) monthlyFee = 500;
      else if (gross <= 10000000) monthlyFee = 1000;
      else monthlyFee = 2000;
    } else if (catName.includes('student')) {
      monthlyFee = 1;
    } else if (catName.includes('resident') || catName.includes('farmer')) {
      monthlyFee = 5;
    } else {
      // Standard Salary-Based
      if (gross <= 0) return { tax: 0, pension: 0, netSalary: 0, percentage: 0, monthlyFee: 0 };

      // Tax calculation
      const taxBrackets = currentSettings?.salaryBased?.taxBrackets;
      if (taxBrackets && Array.isArray(taxBrackets) && taxBrackets.length > 0) {
        const sorted = [...taxBrackets].sort((a, b) => a.threshold - b.threshold);
        let appliedBracket = sorted[sorted.length - 1];
        for (const b of sorted) {
          if (gross <= b.threshold) {
            appliedBracket = b;
            break;
          }
        }
        tax = Math.max(0, (gross * (appliedBracket.rate || 0)) - (appliedBracket.deduction || 0));
      } else {
        if (gross <= 2000) tax = 0;
        else if (gross <= 4000) tax = (gross * 0.15) - 300;
        else if (gross <= 7000) tax = (gross * 0.20) - 500;
        else if (gross <= 10000) tax = (gross * 0.25) - 850;
        else if (gross <= 14000) tax = (gross * 0.30) - 1350;
        else tax = (gross * 0.35) - 2050;
      }

      // Pension calculation
      const pensionPerc = currentSettings?.salaryBased?.pensionPercentage ?? 7;
      pension = gross * (pensionPerc / 100);

      // Net Salary
      netSalary = Math.max(0, gross - tax - pension);

      // Fee Calculation (Standard Salary-Based)
      const calcBase = currentSettings?.salaryBased?.calculationBase || 'Net';
      const salaryToUse = calcBase === 'Net' ? netSalary : gross;

      const brackets = currentSettings?.salaryBased?.[empType.toLowerCase()] || currentSettings?.salaryBased?.private || [];

      if (brackets.length > 0) {
        for (const bracket of brackets) {
          if (salaryToUse >= bracket.minSalary && salaryToUse <= bracket.maxSalary) {
            percentage = bracket.percentage;
            break;
          }
        }
        if (!percentage && salaryToUse > brackets[brackets.length - 1].maxSalary) {
          percentage = brackets[brackets.length - 1].percentage;
        }
      } else {
        if (salaryToUse <= 4000) percentage = 0.6;
        else if (salaryToUse <= 5000) percentage = 0.8;
        else if (salaryToUse <= 6000) percentage = 1.0;
        else if (salaryToUse <= 7000) percentage = 1.2;
        else if (salaryToUse <= 8000) percentage = 1.4;
        else if (salaryToUse <= 9000) percentage = 1.6;
        else if (salaryToUse <= 10000) percentage = 1.8;
        else percentage = 2.0;
      }

      monthlyFee = salaryToUse * (percentage / 100);
    }

    return { tax, pension, netSalary, percentage, monthlyFee };
  };

  const updateRow = (index: number, field: keyof RowData, value: string) => {
    const newRows = [...rows];
    
    // Auto map gender single chars
    if (field === 'gender') {
      const v = value.toLowerCase();
      if (v === 'm' || v === 'ወ' || v === '1') value = 'Male';
      else if (v === 'f' || v === 'ሴ' || v === '2') value = 'Female';
    }

    newRows[index] = { ...newRows[index], [field]: value };

    // If salary was changed, recalculate
    if (field === 'grossSalary') {
      const calcs = calculateRow(value, settings, employmentType);
      newRows[index] = { ...newRows[index], ...calcs };
    }

    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent, startIndex: number) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    const pastedRows = clipboardData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (pastedRows.length === 0) return;

    const newRows = [...rows];
    
    pastedRows.forEach((rowText, i) => {
      const rowIndex = startIndex + i;
      const columns = rowText.split('\t'); // Excel uses tabs
      
      if (columns.length >= 1) {
        const fullName = columns[0].trim();
        let gender = columns[1]?.trim() || 'Male';
        const grossSalary = columns[2]?.trim() || '';

        // Auto map gender
        const gLow = gender.toLowerCase();
        if (gLow === 'm' || gLow === 'ወ' || gLow === '1' || gLow === 'male') gender = 'Male';
        else if (gLow === 'f' || gLow === 'ሴ' || gLow === '2' || gLow === 'female') gender = 'Female';

        const calcs = calculateRow(grossSalary, settings, employmentType);

        const rowData: RowData = {
          id: Math.random().toString(36).substr(2, 9),
          fullName,
          gender,
          grossSalary,
          ...calcs
        };

        if (rowIndex < newRows.length) {
          newRows[rowIndex] = rowData;
        } else {
          newRows.push(rowData);
        }
      }
    });

    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If last row and salary is filled, add new row
      if (index === rows.length - 1 && field === 'grossSalary' && rows[index].grossSalary) {
        setRows([...rows, createEmptyRow()]);
        setTimeout(() => {
          const inputs = tableRef.current?.querySelectorAll(`input[name="fullName-${index + 1}"]`);
          if (inputs && inputs.length > 0) (inputs[0] as HTMLInputElement).focus();
        }, 50);
      } else {
        // Move to next field
        if (field === 'fullName') {
          const inputs = tableRef.current?.querySelectorAll(`select[name="gender-${index}"]`);
          if (inputs && inputs.length > 0) (inputs[0] as HTMLSelectElement).focus();
        } else if (field === 'gender') {
          const inputs = tableRef.current?.querySelectorAll(`input[name="grossSalary-${index}"]`);
          if (inputs && inputs.length > 0) (inputs[0] as HTMLInputElement).focus();
        } else if (field === 'grossSalary') {
          const inputs = tableRef.current?.querySelectorAll(`input[name="fullName-${index + 1}"]`);
          if (inputs && inputs.length > 0) (inputs[0] as HTMLInputElement).focus();
        }
      }
    }
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      setRows([createEmptyRow()]);
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const selectedCat = categories.find(c => String(c.id) === selectedCategoryId);
  const catName = selectedCat?.name.toLowerCase() || '';
  let mType = 'Salary-Based';
  if (catName.includes('wing')) mType = 'Wing';
  else if (catName.includes('enterprise')) mType = 'Business';
  else if (catName.includes('student')) mType = 'Student';
  else if (catName.includes('investor')) mType = 'Investor';
  else if (catName.includes('resident') || catName.includes('farmer')) mType = 'Non-Salary';

  const handleSaveAll = async () => {
    if (!selectedSectorId || !selectedCategoryId) {
      setError(t('common.please_select_sector_and_category'));
      return;
    }

    // For non-salary categories, allow 0 salary. For others, require > 0.
    const isSalaryRequired = mType === 'Salary-Based' || mType === 'Investor';
    const validRows = rows.filter(r => {
      const nameOk = r.fullName.trim() !== '';
      const salaryOk = isSalaryRequired ? Number(r.grossSalary) > 0 : (mType === 'Business' ? !!r.grossSalary : true);
      return nameOk && salaryOk;
    });

    if (validRows.length === 0) {
      setError('No valid rows to save. Please enter member names.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = validRows.map(r => ({
        fullName: r.fullName,
        gender: r.gender,
        financial: {
          salary: mType === 'Salary-Based' || mType === 'Wing' ? Number(r.grossSalary) : 0,
          capital: mType === 'Investor' ? Number(r.grossSalary) : 0,
          income: mType === 'Business' && !isNaN(Number(r.grossSalary)) ? Number(r.grossSalary) : 0,
          businessType: mType === 'Business' ? r.grossSalary : undefined,
          employmentType: employmentType,
          currency: 'ETB',
          occupationType: 'Informal'
        },
        sectorUnitId: Number(selectedSectorId),
        memberCategoryId: Number(selectedCategoryId),
        membershipType: mType,
        wing: { wingType: selectedCat?.name || '' },
        paymentDay: 1,
        address: { region: 'Dire Dawa', city: 'Dire Dawa', woreda: '01' }
      }));

      await api.post('/members/bulk-append', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 md:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('common.fast_entry')} ({t('common.spreadsheet_mode')})</h2>
              <p className="text-xs text-gray-500">{t('common.fast_entry_subtitle')}</p>
            </div>
          </div>

          {/* Live Summary Stats */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('common.total_members')}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {rows.filter(r => r.fullName.trim() !== '' && Number(r.grossSalary) > 0).length}
              </p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">{t('common.monthly_revenue')}</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 leading-none">
                {rows.reduce((acc, r) => acc + r.monthlyFee, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">{t('common.yearly_revenue')}</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300 leading-none">
                {(rows.reduce((acc, r) => acc + r.monthlyFee, 0) * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Top Bar */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {userRole !== 'sector_officer' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.sector_type')} *</label>
                <select
                  value={selectedSectorType}
                  onChange={(e) => {
                    setSelectedSectorType(e.target.value);
                    setSelectedSectorId('');
                  }}
                  className="input bg-white dark:bg-gray-900 w-full"
                >
                  <option value="">{t('common.search')}...</option>
                  {sectorTypes.map(t_obj => (
                    <option key={t_obj.id} value={t_obj.name}>{t(`common.${t_obj.name.toLowerCase()}`, { defaultValue: t_obj.name })}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.sector_unit')} *</label>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="input bg-white dark:bg-gray-900 w-full"
                disabled={userRole !== 'sector_officer' && !selectedSectorType}
              >
                <option value="">{t('common.search')}...</option>
                {sectors.map(s => <option key={s.id} value={s.id}>{t(`common.${s.name}`, { defaultValue: s.name })}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.category')} *</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="input bg-white dark:bg-gray-900 w-full"
              >
                <option value="">{t('common.search')}...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{t(`common.${c.name}`, { defaultValue: c.name })}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('common.employment_type')} *</label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  const newRows = rows.map(r => ({ ...r, ...calculateRow(r.grossSalary, settings, e.target.value) }));
                  setRows(newRows);
                }}
                className="input bg-white dark:bg-gray-900 w-full"
              >
                <option value="Government">{t('common.government')}</option>
                <option value="Private">{t('common.private')}</option>
                <option value="NGO">{t('common.ngo')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spreadsheet Area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-4" ref={tableRef}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-w-[1000px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 w-12 text-center text-gray-500">ተ.ቁ.</th>
                  <th className="px-4 py-3">{t('common.full_name')}</th>
                  <th className="px-4 py-3 w-32">{t('common.sex')}</th>
                  
                  {/* Dynamic Financial Header */}
                  {(mType === 'Salary-Based' || mType === 'Wing') && (
                    <>
                      <th className="px-4 py-3 w-40">{t('common.gross_salary_etb')}</th>
                      <th className="px-4 py-3 w-32">{t('common.income_tax_etb')}</th>
                      <th className="px-4 py-3 w-32">{t('common.pension_etb')}</th>
                      <th className="px-4 py-3 w-36">{t('common.net_salary_etb')}</th>
                      <th className="px-4 py-3 w-24">%</th>
                    </>
                  )}
                  {mType === 'Business' && <th className="px-4 py-3 w-40">{t('common.business_type')}</th>}
                  {mType === 'Investor' && <th className="px-4 py-3 w-40">{t('common.capital')} (ETB)</th>}
                  
                  <th className="px-4 py-3 w-36">{t('common.monthly_fee')}</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                    <td className="px-4 py-2 text-center text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-4 py-1">
                      <input
                        type="text"
                        name={`fullName-${index}`}
                        value={row.fullName}
                        onChange={(e) => updateRow(index, 'fullName', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'fullName')}
                        onPaste={(e) => handlePaste(e, index)}
                        placeholder={t('common.enter_full_name')}
                        className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm font-medium focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded"
                        autoComplete="off"
                      />
                    </td>
                    <td className="px-4 py-1">
                      <select
                        name={`gender-${index}`}
                        value={row.gender}
                        onChange={(e) => updateRow(index, 'gender', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'gender')}
                        className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm font-medium text-gray-600 dark:text-gray-300 focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded"
                      >
                        <option value="Male">{t('common.male')} (M/ወ)</option>
                        <option value="Female">{t('common.female')} (F/ሴ)</option>
                      </select>
                    </td>

                    {/* Financial Inputs / Displays */}
                    {(mType === 'Salary-Based' || mType === 'Wing' || mType === 'Investor') && (
                      <td className="px-4 py-1">
                        <input
                          type="number"
                          name={`grossSalary-${index}`}
                          value={row.grossSalary}
                          onChange={(e) => updateRow(index, 'grossSalary', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'grossSalary')}
                          placeholder="0.00"
                          className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm font-bold text-gray-900 dark:text-white focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded"
                        />
                      </td>
                    )}

                    {mType === 'Business' && (
                      <td className="px-4 py-1">
                        <select
                          name={`grossSalary-${index}`}
                          value={row.grossSalary || 'Micro'}
                          onChange={(e) => updateRow(index, 'grossSalary', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'grossSalary')}
                          className="w-full bg-transparent border-0 focus:ring-0 p-1 text-sm font-bold text-gray-900 dark:text-white focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded"
                        >
                          <option value="Micro">{t('common.micro')}</option>
                          <option value="Small">{t('common.small')}</option>
                          <option value="Medium">{t('common.medium')}</option>
                        </select>
                      </td>
                    )}

                    {(mType === 'Salary-Based' || mType === 'Wing') && (
                      <>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{row.tax > 0 ? row.tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{row.pension > 0 ? row.pension.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td className="px-4 py-2 text-primary font-mono font-bold text-sm">{row.netSalary > 0 ? row.netSalary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{row.percentage > 0 ? `${row.percentage}%` : '-'}</td>
                      </>
                    )}

                    <td className="px-4 py-2 text-green-600 dark:text-green-400 font-mono font-bold text-sm">
                      {row.monthlyFee > 0 ? row.monthlyFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : (mType === 'Student' || mType === 'Non-Salary' ? calculateRow('0', settings, employmentType).monthlyFee : '-')}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeRow(index)} className="hover:text-red-500 transition-colors p-1" title="Remove row">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 border-t border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setRows([...rows, createEmptyRow()])}
                className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" /> {t('common.add_row')}
              </button>
              <span className="text-xs text-gray-400 ml-4 hidden sm:inline-block">{t('common.press_enter_tip')}</span>
              <span className="text-xs text-blue-400 ml-4 hidden md:inline-block">{t('common.paste_excel_tip')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 md:p-6 flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-500">
            {t('common.valid_rows_ready', { count: rows.filter(r => r.fullName && Number(r.grossSalary) > 0).length })}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn btn-secondary px-6">
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleSaveAll} 
              disabled={saving} 
              className="btn btn-primary px-8 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('common.loading') : t('common.save_all')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
