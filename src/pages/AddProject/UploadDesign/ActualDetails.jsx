import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Calendar, Tag, Search } from 'lucide-react';
import { getProjects, getActuals, getProjectOrMinor } from '../../../utils/storageManager';
import { buildChainageDiffMap } from '../../../utils/helpers';
import DataTable from '../../../components/DataTable';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { DESIGN_COLUMNS } from './UploadDesign';

// Alignment already has its own column - exclude it from the measurement fields
const MEASURE_COLUMNS = DESIGN_COLUMNS.filter(col => col.key !== 'alignment');
// Same fields as Design, labelled with an "Act-" prefix for this table
const ACTUAL_COLUMNS = MEASURE_COLUMNS.map(col => ({ key: col.key, label: `Act-${col.label}` }));

// Show the value as-is (0 included) - only fall back to '-' when it's actually empty
const displayVal = (v) => {
  if (v === undefined || v === null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : v;
};

// YYYY-MM-DD (from the date input) -> DD/MM/YYYY for display
const formatDate = (d) => {
  if (!d) return '-';
  const [y, m, day] = String(d).split('-');
  return (y && m && day) ? `${day}/${m}/${y}` : d;
};

export default function ActualDetails() {
  const { projectNo } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pipeDiaFilter, setPipeDiaFilter] = useState('');

  useEffect(() => {
    const decodedNo = decodeURIComponent(projectNo || '');
    const found = getProjectOrMinor(decodedNo);
    setProject(found || null);
    setEntries(getActuals().filter(e => e.projectNo === decodedNo));
  }, [projectNo]);

  // Unique Pipe Dia values from each entry's Actual snapshot, sorted ascending (small to high) -
  // rendered as extra headers after Act-Remarks
  const uniquePipeDias = Array.from(new Set(entries.map(e => e.actual?.pipeDia)))
    .filter(v => v !== undefined && v !== null && v !== '')
    .sort((a, b) => Number(a) - Number(b));

  // Value shown under an entry's matching Pipe Dia column: this entry's Actual Chainage minus
  // the upper (previous, by Serial No) entry's Actual Chainage. See buildChainageDiffMap for
  // the 0/missing-Chainage rule.
  const bySerialNo = [...entries].sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0));
  const chainageDiffMap = buildChainageDiffMap(bySerialNo, e => e.actual?.chainage, e => e.id);

  const tableHeaders = [
    "Serial No", "Alignment", ...ACTUAL_COLUMNS.map(col => col.label), "Act-Date", "Act-Remarks", "Hard Rock",
    ...uniquePipeDias.map(String)
  ];

  const pipeDiaOptions = uniquePipeDias.map(v => ({ value: v, label: String(v) }));

  const filteredEntries = entries.filter(e => {
    if (pipeDiaFilter && String(e.actual?.pipeDia) !== String(pipeDiaFilter)) return false;
    if (searchQuery && !String(e.alignment).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0));

  // Totals row: sum of each Pipe Dia column's values across the currently filtered entries
  const pipeDiaTotals = uniquePipeDias.map(dia =>
    filteredEntries.reduce((sum, entry) => {
      if (String(entry.actual?.pipeDia) !== String(dia)) return sum;
      const diff = chainageDiffMap.get(entry.id);
      return diff !== undefined ? sum + diff : sum;
    }, 0)
  );
  const totalRow = [
    'Total',
    '',
    ...ACTUAL_COLUMNS.map(() => ''),
    '',
    '',
    '',
    ...pipeDiaTotals.map(t => t.toFixed(3))
  ];

  const renderRow = (entry) => (
    <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors border-b border-gray-100">
      <td className="px-4 py-2.5 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{entry.serialNo}</td>
      <td className="px-4 py-2.5 text-center text-[11px] text-gray-700 whitespace-nowrap">{entry.alignment}</td>
      {ACTUAL_COLUMNS.map(col => (
        <td key={col.key} className="px-4 py-2.5 text-center text-[11px] text-gray-700 whitespace-nowrap">
          {displayVal(entry.actual?.[col.key])}
        </td>
      ))}
      <td className="px-4 py-2.5 text-center text-[11px] text-gray-700 whitespace-nowrap">{formatDate(entry.submitDate)}</td>
      <td className="px-4 py-2.5 text-left text-[11px] text-gray-600 max-w-[220px] truncate" title={entry.remarks || ''}>
        {entry.remarks || '-'}
      </td>
      <td className="px-4 py-2.5 text-center text-[11px] whitespace-nowrap">
        {entry.isHardRock
          ? <span className="text-amber-700 font-semibold">{entry.hardRockValue || '-'}</span>
          : <span className="text-gray-300">-</span>}
      </td>
      {uniquePipeDias.map(dia => {
        const diff = String(entry.actual?.pipeDia) === String(dia) ? chainageDiffMap.get(entry.id) : undefined;
        return (
          <td key={`dia-${dia}`} className={`px-4 py-2.5 text-center text-[11px] whitespace-nowrap ${diff !== undefined ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>
            {diff !== undefined ? diff.toFixed(3) : '-'}
          </td>
        );
      })}
    </tr>
  );

  const renderCard = (entry) => (
    <div key={entry.id} className="rounded-lg border border-gray-200 shadow-sm p-3 space-y-1.5 bg-white">
      <div className="flex justify-between items-start border-b border-gray-200 pb-1.5 mb-1">
        <span className="text-[9px] text-indigo-500 uppercase tracking-widest">#{entry.serialNo}</span>
        <span className="text-[10px] text-gray-700 font-medium">Alignment: {entry.alignment}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {ACTUAL_COLUMNS.map(col => (
          <div key={col.key} className="flex justify-between px-1.5 py-0.5 rounded">
            <span className="text-gray-500">{col.label}:</span>
            <span className="text-gray-800">{displayVal(entry.actual?.[col.key])}</span>
          </div>
        ))}
        <div className="flex justify-between px-1.5 py-0.5 rounded">
          <span className="text-gray-500">Act-Date:</span>
          <span className="text-gray-800">{formatDate(entry.submitDate)}</span>
        </div>
      </div>
      {entry.remarks && (
        <div className="text-[10px] px-1.5 py-1 bg-gray-50 rounded">
          <span className="text-gray-500">Act-Remarks: </span>
          <span className="text-gray-800">{entry.remarks}</span>
        </div>
      )}
      {entry.isHardRock && (
        <div className="text-[10px] px-1.5 py-1 bg-amber-50 rounded">
          <span className="text-gray-500">Hard Rock: </span>
          <span className="text-amber-700 font-semibold">{entry.hardRockValue || '-'}</span>
        </div>
      )}
      {uniquePipeDias.length > 0 && (
        <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-gray-100">
          {uniquePipeDias.map(dia => {
            const diff = String(entry.actual?.pipeDia) === String(dia) ? chainageDiffMap.get(entry.id) : undefined;
            return (
              <div key={dia} className="flex justify-between px-1.5 py-0.5 rounded">
                <span className="text-gray-500">&Oslash;{dia}:</span>
                <span className={diff !== undefined ? 'text-gray-800 font-semibold' : 'text-gray-400'}>
                  {diff !== undefined ? diff.toFixed(3) : '-'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!project) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => project?.isMinor ? navigate(`/actual-details/${encodeURIComponent(project.parentProjectNo)}`) : navigate('/add-project')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500 text-sm">
          Project not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-3 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Back + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full px-2 sm:px-0">
        <button
          onClick={() => navigate(`/view-design/${encodeURIComponent(project.serialNo)}`)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold w-fit flex-shrink-0"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex-1 min-w-0 relative max-w-sm">
          <Search className="absolute left-2.5 top-[9px] md:top-[11px] text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search alignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg md:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-xs md:text-sm h-[32px] md:h-[38px]"
          />
        </div>

        <div className="w-40 md:w-48 flex-shrink-0">
          <SearchableDropdown
            options={pipeDiaOptions}
            value={pipeDiaFilter}
            onChange={(val) => setPipeDiaFilter(val)}
            placeholder="All Pipe Dia"
            height="h-[32px] md:h-[38px]"
          />
        </div>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 mx-2 sm:mx-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-start gap-2 min-w-0">
            <Tag size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Project No</p>
              <p className="text-base md:text-lg text-indigo-600 font-bold truncate">{project.serialNo}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Building2 size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Project Name</p>
              <p className="text-base md:text-lg text-gray-900 font-bold truncate">{project.projectName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <MapPin size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Project Location</p>
              <p className="text-base md:text-lg text-gray-900 font-bold truncate">{project.projectLocation}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Calendar size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Start Date</p>
              <p className="text-base md:text-lg text-gray-900 font-bold truncate">{project.startDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 min-w-0">
            <Calendar size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Planned End Date</p>
              <p className="text-base md:text-lg text-gray-900 font-bold truncate">{project.plannedEndDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mx-2 sm:mx-0">
        <DataTable
          headers={tableHeaders}
          data={filteredEntries}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1600px"
          totalRow={totalRow}
        />
      </div>
    </div>
  );
}
