import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Calendar, Tag, Search } from 'lucide-react';
import { getProjects, getDesignByProject, getExecutions, getActuals, getProjectOrMinor } from '../../../utils/storageManager';
import { buildChainageDiffMap } from '../../../utils/helpers';
import DataTable from '../../../components/DataTable';
import { DESIGN_COLUMNS } from './UploadDesign';

// Alignment already has its own column - exclude it from the measurement fields
const MEASURE_COLUMNS = DESIGN_COLUMNS.filter(col => col.key !== 'alignment');

// Identify a design row by Alignment + all of its own Design values (already scoped to one project)
const designKey = (entry) => [
  entry.alignment,
  ...MEASURE_COLUMNS.map(col => String(entry.design?.[col.key] ?? ''))
].join('|');

const parseNum = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// Show the value as-is (0 included) - only fall back to '-' when it's actually empty
const displayVal = (v) => {
  if (v === undefined || v === null || v === '') return '-';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : v;
};

// Per-field comparison against Design: 'match' (equal), 'over' (design < value -> red),
// 'under' (design > value -> yellow), or null when the field hasn't been filled in yet
const getFieldStatus = (designVal, otherVal) => {
  if (otherVal === undefined || otherVal === null || String(otherVal).trim() === '') return null;
  const d = parseNum(designVal);
  const o = parseNum(otherVal);
  if (d !== null && o !== null) {
    if (Math.abs(d - o) < 0.0001) return 'match';
    return d < o ? 'over' : 'under';
  }
  return String(designVal ?? '').trim() === String(otherVal).trim() ? 'match' : 'over';
};

const cellClass = (status) =>
  status === 'match' ? 'bg-emerald-100 text-emerald-800 font-semibold'
  : status === 'over' ? 'bg-red-100 text-red-800 font-semibold'
  : status === 'under' ? 'bg-yellow-100 text-yellow-800 font-semibold'
  : 'text-gray-700';

const TYPE_COLORS = { Design: 'text-gray-500', Execution: 'text-indigo-600', Actual: 'text-emerald-600' };
const TypeBadge = ({ type }) => (
  <span className={`${TYPE_COLORS[type] || 'text-gray-500'} font-bold text-[10px] uppercase tracking-wide`}>{type}</span>
);

export default function AutoComparison() {
  const { projectNo } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const decodedNo = decodeURIComponent(projectNo || '');
    const found = getProjectOrMinor(decodedNo);
    setProject(found || null);

    const designs = getDesignByProject(decodedNo);
    const executions = getExecutions().filter(e => e.projectNo === decodedNo);
    const actuals = getActuals().filter(a => a.projectNo === decodedNo);
    const map = new Map();

    designs.forEach(d => {
      const key = designKey(d);
      if (!map.has(key)) {
        map.set(key, { key, serialNo: d.serialNo, alignment: d.alignment, design: d.design, execution: null, actual: null });
      }
    });

    executions.forEach(e => {
      const key = designKey(e);
      if (!map.has(key)) {
        map.set(key, { key, serialNo: e.serialNo, alignment: e.alignment, design: e.design, execution: null, actual: null });
      }
      map.get(key).execution = e.execution;
    });

    actuals.forEach(a => {
      const key = designKey(a);
      if (!map.has(key)) {
        map.set(key, { key, serialNo: a.serialNo, alignment: a.alignment, design: a.design, execution: null, actual: null });
      }
      map.get(key).actual = a.actual;
    });

    setGroups(Array.from(map.values()));
  }, [projectNo]);

  // Unique Pipe Dia values across Design, Execution and Actual snapshots, sorted ascending
  // (small to high) - rendered as extra headers after the Type column
  const uniquePipeDias = Array.from(new Set(groups.flatMap(g => [g.design?.pipeDia, g.execution?.pipeDia, g.actual?.pipeDia])))
    .filter(v => v !== undefined && v !== null && v !== '')
    .sort((a, b) => Number(a) - Number(b));

  // Value shown under a row's matching Pipe Dia column: this row's own Chainage minus the
  // upper (previous, by Serial No) group's Chainage of the same type - Design compares against
  // Design, Execution against Execution, Actual against Actual. See buildChainageDiffMap for
  // the 0/missing-Chainage rule.
  const bySerialNo = [...groups].sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0));
  const chainageDiffMapsByType = {
    Design: buildChainageDiffMap(bySerialNo, g => g.design?.chainage, g => g.key),
    Execution: buildChainageDiffMap(bySerialNo, g => g.execution?.chainage, g => g.key),
    Actual: buildChainageDiffMap(bySerialNo, g => g.actual?.chainage, g => g.key)
  };

  const tableHeaders = ["Serial No", "Alignment", ...MEASURE_COLUMNS.map(col => col.label), "Type", ...uniquePipeDias.map(String)];

  const filteredGroups = groups.filter(g => {
    if (!searchQuery) return true;
    return String(g.alignment).toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => (a.serialNo ?? 0) - (b.serialNo ?? 0));

  // Totals footer: a single compact row - each Pipe Dia cell packs the Design/Execution/Actual
  // totals inline (instead of three separate sub-rows) to save vertical space for the table.
  const TOTAL_TYPE_STYLES = { Design: 'text-gray-500', Execution: 'text-indigo-600', Actual: 'text-emerald-600' };
  const totalRow = [
    'Total',
    '',
    ...MEASURE_COLUMNS.map(() => ''),
    '',
    ...uniquePipeDias.map(dia => (
      <div key={dia} className="flex items-center justify-center gap-2 whitespace-nowrap">
        {['Design', 'Execution', 'Actual'].map(type => {
          const total = filteredGroups.reduce((sum, group) => {
            const values = type === 'Design' ? group.design : type === 'Execution' ? group.execution : group.actual;
            if (String(values?.pipeDia) !== String(dia)) return sum;
            const diff = chainageDiffMapsByType[type].get(group.key);
            return diff !== undefined ? sum + diff : sum;
          }, 0);
          return (
            <span key={type} className={TOTAL_TYPE_STYLES[type]}>
              {type[0]} {total.toFixed(3)}
            </span>
          );
        })}
      </div>
    ))
  ];

  // Each group becomes three grouped rows: Design, Execution, Actual (both compared against Design)
  // Serial No is the design row's original position in ViewDesign - not recomputed here
  const displayRows = filteredGroups.flatMap((group) => {
    const base = { serialNo: group.serialNo, alignment: group.alignment, entryId: group.key };
    return [
      { ...base, key: `${group.key}-design`, groupFirst: true, values: group.design, type: 'Design' },
      { ...base, key: `${group.key}-execution`, groupFirst: false, values: group.execution, type: 'Execution', compareTo: group.design },
      { ...base, key: `${group.key}-actual`, groupFirst: false, values: group.actual, type: 'Actual', compareTo: group.design }
    ];
  });

  const renderRow = (item) => (
    <tr key={item.key} className={`transition-colors border-b border-gray-100 hover:bg-gray-50/70 ${item.groupFirst ? 'border-t-2 border-t-gray-200' : ''}`}>
      <td className="px-4 py-2.5 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.groupFirst ? item.serialNo : ''}</td>
      <td className="px-4 py-2.5 text-center text-[11px] text-gray-700 whitespace-nowrap">{item.groupFirst ? item.alignment : ''}</td>
      {MEASURE_COLUMNS.map(col => {
        const val = item.values?.[col.key];
        const status = item.compareTo ? getFieldStatus(item.compareTo[col.key], val) : null;
        return (
          <td key={col.key} className={`px-4 py-2.5 text-center text-[11px] whitespace-nowrap ${status ? cellClass(status) : 'text-gray-700'}`}>
            {displayVal(val)}
          </td>
        );
      })}
      <td className="px-4 py-2.5 text-center whitespace-nowrap"><TypeBadge type={item.type} /></td>
      {uniquePipeDias.map(dia => {
        const ownPipeDia = item.values?.pipeDia;
        const isMatch = ownPipeDia !== undefined && ownPipeDia !== null && ownPipeDia !== '' && String(ownPipeDia) === String(dia);
        const diff = isMatch ? chainageDiffMapsByType[item.type]?.get(item.entryId) : undefined;
        return (
          <td key={`dia-${dia}`} className={`px-4 py-2.5 text-center text-[11px] whitespace-nowrap ${diff !== undefined ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>
            {diff !== undefined ? diff.toFixed(3) : '-'}
          </td>
        );
      })}
    </tr>
  );

  const renderCard = (item) => (
    <div key={item.key} className={`rounded-lg border border-gray-200 shadow-sm p-3 space-y-1.5 bg-white ${item.groupFirst ? 'mt-1' : ''}`}>
      {item.groupFirst && (
        <div className="flex justify-between items-start border-b border-gray-200 pb-1.5 mb-1">
          <span className="text-[9px] text-indigo-500 uppercase tracking-widest">#{item.serialNo}</span>
          <span className="text-[10px] text-gray-700 font-medium">Alignment: {item.alignment}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <TypeBadge type={item.type} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {MEASURE_COLUMNS.map(col => {
          const val = item.values?.[col.key];
          const status = item.compareTo ? getFieldStatus(item.compareTo[col.key], val) : null;
          return (
            <div key={col.key} className={`flex justify-between px-1.5 py-0.5 rounded ${status ? cellClass(status) : ''}`}>
              <span className="text-gray-500">{col.label}:</span>
              <span className={status ? '' : 'text-gray-800'}>{displayVal(val)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!project) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => project?.isMinor ? navigate(`/auto-comparison/${encodeURIComponent(project.parentProjectNo)}`) : navigate('/add-project')}
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
      {/* Back + Search + Legend */}
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

        <div className="flex items-center gap-3 text-[10px] md:text-xs flex-shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Equal</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-300 inline-block" /> Higher than Design</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-100 border border-yellow-300 inline-block" /> Lower than Design</span>
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
          data={displayRows}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1200px"
          totalRow={totalRow}
        />
      </div>
    </div>
  );
}
