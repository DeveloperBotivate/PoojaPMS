import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { UploadCloud, FileSpreadsheet, Check, Building2, MapPin, Calendar } from 'lucide-react';
import { saveDesignForProject } from '../../../utils/storageManager';
import ModalForm from '../../../components/ModalForm';

// Column keys must match the ones used by ViewDesign.jsx
export const DESIGN_COLUMNS = [
  { key: 'alignment', label: 'Alignment' },
  { key: 'chainage', label: 'Chainage' },
  { key: 'elevation', label: 'Elevation' },
  { key: 'pipeTop', label: 'Pipe Top' },
  { key: 'pipeBottom', label: 'Pipe Bottom' },
  { key: 'cuttingLevel', label: 'Cutting Level' },
  { key: 'invertLevel', label: 'Invert Level' },
  { key: 'pipeDia', label: 'Pipe Dia' },
];

// Accepts a few common spellings/variants for each column header in the uploaded file
const HEADER_ALIASES = {
  alignment: 'alignment',
  chainage: 'chainage',
  elevation: 'elevation',
  pipetop: 'pipeTop',
  pipebottom: 'pipeBottom',
  pipebutton: 'pipeBottom',
  cuttinglevel: 'cuttingLevel',
  invertlevel: 'invertLevel',
  pipedia: 'pipeDia',
  pipediameter: 'pipeDia',
  pipedie: 'pipeDia',
};

const normalizeKey = (key) => String(key).toLowerCase().replace(/[^a-z]/g, '');

// Show the value as-is (0 included) - only fall back to '-' when it's actually empty.
// Numeric values are shown with 3 digits after the decimal point; non-numeric text is untouched.
const displayVal = (v) => {
  if (v === undefined || v === null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : v;
};

export default function UploadDesign({ isOpen, onClose, project, onUploaded }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !project) return null;

  const resetState = () => {
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
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // First try header-based mapping (matches column names to our fields)
      const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let mappedRows = jsonRows.map(row => {
        const mapped = {};
        Object.keys(row).forEach(key => {
          const target = HEADER_ALIASES[normalizeKey(key)];
          if (target) mapped[target] = row[key];
        });
        return mapped;
      }).filter(row => Object.keys(row).length > 0);

      // Fallback: if header matching found almost nothing, assume columns
      // are in the fixed order Alignment/Chainage/.../Pipe Dia and skip the header row
      const matchedFieldCount = mappedRows.reduce((sum, r) => sum + Object.keys(r).length, 0);
      if (jsonRows.length > 0 && matchedFieldCount < jsonRows.length) {
        const arrayRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const bodyRows = arrayRows.slice(1);
        const positional = bodyRows
          .filter(r => r.some(cell => String(cell).trim() !== ''))
          .map(r => {
            const mapped = {};
            DESIGN_COLUMNS.forEach((col, idx) => {
              mapped[col.key] = r[idx] ?? '';
            });
            return mapped;
          });
        if (positional.length >= mappedRows.length) {
          mappedRows = positional;
        }
      }

      if (mappedRows.length === 0) {
        toast.error('No valid rows found in the file');
        return;
      }

      setFileName(file.name);
      setRows(mappedRows);
      toast.success(`${mappedRows.length} rows loaded`);
    } catch (error) {
      toast.error('Could not read file. Please upload a valid Excel/CSV file.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rows.length === 0) {
      toast.error('Please upload a file first');
      return;
    }

    setLoading(true);
    saveDesignForProject(project.serialNo, rows);
    toast.success(`Design uploaded for ${project.serialNo}`);
    setLoading(false);
    resetState();
    onUploaded && onUploaded();
    onClose();
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={handleClose}
      title={`Upload Design - ${project.serialNo}`}
      onSubmit={handleSubmit}
      submitText={loading ? 'Uploading...' : 'Upload'}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-3 md:space-y-4">
        {/* Prefilled Project Info */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 pb-3 md:pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Project Name</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 h-[30px] md:h-[34px]">
              <Building2 size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] text-gray-800 truncate">{project.projectName}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Project Location</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 h-[30px] md:h-[34px]">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] text-gray-800 truncate">{project.projectLocation}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Start Date</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 h-[30px] md:h-[34px]">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] text-gray-800 truncate">{project.startDate}</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] md:text-[12px] text-gray-500 uppercase tracking-tighter">Planned End Date</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 h-[30px] md:h-[34px]">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] text-gray-800 truncate">{project.plannedEndDate}</span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
            Upload Design File (Alignment / Chainage / Elevation / Pipe Top / Pipe Bottom / Cutting Level / Invert Level / Pipe Dia)
          </label>
          <label className="cursor-pointer block">
            <div className={`flex items-center justify-center gap-2 border border-dashed rounded-lg h-[70px] transition-all
              ${fileName ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'}
            `}>
              {fileName ? <Check size={18} /> : <UploadCloud size={18} />}
              <span className="text-xs md:text-sm font-medium">
                {fileName ? `${fileName} - ${rows.length} rows` : 'Click to browse Excel / CSV file'}
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

        {/* Preview */}
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
