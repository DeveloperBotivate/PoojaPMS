import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { generateId, getTodayDate } from '../../../utils/helpers';
import { saveExecution } from '../../../utils/storageManager';
import ModalForm from '../../../components/ModalForm';
import { DESIGN_COLUMNS } from './UploadDesign';

// Alignment is shown separately above - exclude it from the Design/Execution measurement grids
const MEASURE_COLUMNS = DESIGN_COLUMNS.filter(col => col.key !== 'alignment');

// Numeric values are shown with 3 digits after the decimal point; non-numeric/empty values pass through
const fmt3 = (v) => {
  if (v === undefined || v === null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : v;
};

// Execution values start pre-filled from the Design row (still fully editable)
const prefillValues = (designRow) =>
  MEASURE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: designRow?.[col.key] ?? '' }), {});

export default function Execution({ isOpen, onClose, project, designRow, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({});
  const [submitDate, setSubmitDate] = useState(getTodayDate());
  const [remarks, setRemarks] = useState('');
  const [isHardRock, setIsHardRock] = useState(false);
  const [hardRockValue, setHardRockValue] = useState('');

  useEffect(() => {
    if (isOpen && designRow) {
      setValues(prefillValues(designRow));
      setSubmitDate(getTodayDate());
      setRemarks('');
      setIsHardRock(false);
      setHardRockValue('');
    }
  }, [isOpen, designRow]);

  if (!isOpen || !project || !designRow) return null;

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const hasAnyValue = MEASURE_COLUMNS.some(col => String(values[col.key] ?? '').trim() !== '');
    if (!hasAnyValue) {
      toast.error('Please fill at least one execution value');
      return;
    }
    if (!submitDate) {
      toast.error('Submit Date is required');
      return;
    }
    if (isHardRock && !String(hardRockValue).trim()) {
      toast.error('Please enter the Hard Rock value');
      return;
    }

    setLoading(true);

    const design = MEASURE_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: designRow[col.key] ?? '' }), {});
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const entry = {
      id: generateId(),
      timestamp,
      projectNo: project.serialNo,
      projectName: project.projectName,
      serialNo: designRow.__serialNo,
      alignment: designRow.alignment,
      submitDate,
      remarks,
      isHardRock,
      hardRockValue: isHardRock ? hardRockValue : '',
      design,
      execution: { ...values }
    };

    saveExecution(entry);
    toast.success('Execution entry saved');
    setLoading(false);
    onSaved && onSaved();
    onClose();
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Execution Entry"
      onSubmit={handleSubmit}
      submitText={loading ? 'Saving...' : 'Save'}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-3 md:space-y-4">
        <div className="pb-2 border-b border-gray-100 flex flex-wrap gap-2 md:gap-4">
          <div className="w-full sm:w-56 space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Alignment</label>
            <input
              type="text"
              value={designRow.alignment || ''}
              readOnly
              className="w-full border border-gray-200 bg-gray-100 text-indigo-600 font-bold rounded px-2 py-1 focus:outline-none text-[12px] md:text-[13px] h-[30px] md:h-[34px] cursor-not-allowed"
            />
          </div>
          <div className="w-full sm:w-56 space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-700 uppercase tracking-tighter">Submit Date *</label>
            <input
              type="date"
              value={submitDate}
              onChange={(e) => setSubmitDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[12px] md:text-[13px] h-[30px] md:h-[34px]"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="flex items-center gap-2 h-[30px] md:h-[34px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isHardRock}
                  onChange={(e) => { setIsHardRock(e.target.checked); if (!e.target.checked) setHardRockValue(''); }}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] md:text-[12px] text-gray-700 uppercase tracking-tighter">If Hard Rock</span>
              </label>
            </div>
            {isHardRock && (
              <div className="space-y-1">
                <label className="block text-[10px] md:text-[12px] text-gray-700 uppercase tracking-tighter">Hard Rock Level *</label>
                <input
                  type="text"
                  value={hardRockValue}
                  onChange={(e) => setHardRockValue(e.target.value)}
                  placeholder="Enter"
                  autoFocus
                  className="w-[160px] md:w-[200px] border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[12px] md:text-[13px] h-[30px] md:h-[34px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Design row (read-only, pre-filled) */}
        <div>
          <h3 className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1.5">Design</h3>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {MEASURE_COLUMNS.map(col => (
              <div key={col.key} className="space-y-1">
                <label className="block text-[9px] md:text-[10px] text-gray-400 uppercase tracking-tighter truncate">{col.label}</label>
                <input
                  type="text"
                  value={fmt3(designRow[col.key])}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-100 text-gray-600 rounded px-2 py-1 focus:outline-none text-[11px] md:text-[12px] h-[30px] md:h-[34px] cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Execution row (editable) */}
        <div>
          <h3 className="text-[10px] md:text-xs text-indigo-500 uppercase tracking-widest mb-1.5">Execution</h3>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {MEASURE_COLUMNS.map(col => (
              <div key={col.key} className="space-y-1">
                <label className="block text-[9px] md:text-[10px] text-gray-500 uppercase tracking-tighter truncate">{col.label}</label>
                <input
                  type="text"
                  value={values[col.key]}
                  onChange={(e) => handleChange(col.key, e.target.value)}
                  placeholder="Enter"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[12px] h-[30px] md:h-[34px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any remarks (optional)"
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[12px] resize-none"
          />
        </div>
      </div>
    </ModalForm>
  );
}
