import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Check, FileSpreadsheet } from 'lucide-react';
import { generateId } from '../../../utils/helpers';
import { saveMinor, saveDesignForProject } from '../../../utils/storageManager';
import ModalForm from '../../../components/ModalForm';
import { DESIGN_COLUMNS, parseDesignFile } from './UploadDesign';

// Show the value as-is (0 included) - only fall back to '-' when it's actually empty.
const displayVal = (v) => {
  if (v === undefined || v === null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : v;
};

/**
 * AddMinorModal
 * Creates a Minor under a project: a name plus an optional design file (parsed the same way
 * as UploadDesign.jsx). The new minor then behaves like its own project everywhere downstream
 * (Execution Details, Actual Details, Excavation & Murum, Auto Comparison) via getProjectOrMinor.
 */
export default function AddMinorModal({ isOpen, onClose, project, onSaved }) {
  const [minorName, setMinorName] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !project) return null;

  const resetState = () => {
    setMinorName('');
    setFileName('');
    setRows([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const mappedRows = await parseDesignFile(file);
      if (mappedRows.length === 0) {
        toast.error('No valid rows found in the file');
        return;
      }
      setFileName(file.name);
      setRows(mappedRows);
      toast.success(`${mappedRows.length} rows loaded`);
    } catch {
      toast.error('Could not read file. Please upload a valid Excel/CSV file.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!minorName.trim()) {
      toast.error('Minor Name is required');
      return;
    }

    setLoading(true);

    const minor = {
      id: generateId(),
      projectNo: project.serialNo,
      minorName: minorName.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      saveMinor(minor);
      if (rows.length > 0) {
        saveDesignForProject(minor.id, rows);
      }
    } catch {
      setLoading(false);
      return;
    }

    toast.success('Minor added successfully');
    setLoading(false);
    resetState();
    onSaved && onSaved(minor);
    onClose();
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Minor — ${project.serialNo}`}
      onSubmit={handleSubmit}
      submitText={loading ? 'Saving...' : 'Save'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-3 md:space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Minor Name *</label>
          <input
            type="text"
            value={minorName}
            onChange={(e) => setMinorName(e.target.value)}
            placeholder="Enter minor name"
            className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
            Upload The Design (Alignment / Chainage / Elevation / Pipe Top / Pipe Bottom / Cutting Level / Invert Level / Pipe Dia)
          </label>
          <label className="cursor-pointer block">
            <div className={`flex items-center justify-center gap-2 border border-dashed rounded-lg h-[70px] transition-all
              ${fileName ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'}
            `}>
              {fileName ? <Check size={18} /> : <UploadCloud size={18} />}
              <span className="text-xs md:text-sm font-medium">
                {fileName ? `${fileName} - ${rows.length} rows` : 'Click to browse Excel / CSV file (optional)'}
              </span>
            </div>
            <input
              type="file"
              onChange={handleFile}
              className="hidden"
              accept=".xlsx,.xls,.csv"
            />
          </label>
        </div>

        {rows.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
              <FileSpreadsheet size={14} />
              <span>Preview (first 5 rows)</span>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-[10px] md:text-[11px]">
                <thead className="bg-gray-50">
                  <tr>
                    {DESIGN_COLUMNS.map(col => (
                      <th key={col.key} className="px-2 py-1.5 text-center font-semibold text-gray-700 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {DESIGN_COLUMNS.map(col => (
                        <td key={col.key} className="px-2 py-1.5 text-center text-gray-600 whitespace-nowrap">{displayVal(row[col.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ModalForm>
  );
}
