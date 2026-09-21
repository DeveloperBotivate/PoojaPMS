import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, History as HistoryIcon, ClipboardCheck, User, Phone, Users, Plus, Trash2, Search, RotateCcw } from 'lucide-react';
import { getProjects, getMobilizations, upsertMobilization, isMobilizationComplete } from '../../utils/storageManager';
import { amountInWords, generateId } from '../../utils/helpers';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import InfoPopover from '../../components/InfoPopover';

const initialFormData = {
  consultants: [],
  remarks: ''
};

// Format YYYY-MM-DD -> DD/MM/YYYY for display
const formatDate = (val) => {
  if (!val) return '-';
  const parts = val.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
};

const initialFilters = { searchQuery: '', projectName: '', contractorName: '', projectLocation: '' };

export default function Mobilization() {
  const [projects, setProjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [formProject, setFormProject] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ ...initialFilters });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const refresh = () => {
    setProjects(getProjects());
    setRecords(getMobilizations());
  };

  useEffect(() => { refresh(); }, []);

  const recordFor = (projectNo) => records.find(r => r.projectNo === projectNo) || null;

  const pendingProjects = projects.filter(p => !isMobilizationComplete(recordFor(p.serialNo))).reverse();
  const historyProjects = projects.filter(p => isMobilizationComplete(recordFor(p.serialNo))).reverse();

  const list = activeTab === 'pending' ? pendingProjects : historyProjects;

  const filteredList = list.filter(p => {
    if (filters.projectName && p.projectName !== filters.projectName) return false;
    if (filters.contractorName && p.contractorName !== filters.contractorName) return false;
    if (filters.projectLocation && p.projectLocation !== filters.projectLocation) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return (
        p.serialNo.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.contractorName.toLowerCase().includes(q) ||
        (p.contractorPhone || '').toLowerCase().includes(q) ||
        (p.contractorEmail || '').toLowerCase().includes(q) ||
        p.projectLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginated = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleClearFilters = () => {
    setFilters({ ...initialFilters });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const openForm = (project) => {
    const rec = recordFor(project.serialNo);
    const existing = rec && Array.isArray(rec.consultants) ? rec.consultants : [];
    setFormData({
      consultants: existing.length > 0 ? existing : [{ id: generateId(), name: '', number: '' }],
      remarks: rec?.remarks || ''
    });
    setFormProject(project);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const addConsultantRow = () => {
    setFormData(prev => ({ ...prev, consultants: [...prev.consultants, { id: generateId(), name: '', number: '' }] }));
  };

  const removeConsultantRow = (id) => {
    setFormData(prev => ({ ...prev, consultants: prev.consultants.filter(c => c.id !== id) }));
  };

  const updateConsultantRow = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      consultants: prev.consultants.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    for (const c of formData.consultants) {
      if (!c.name.trim()) { toast.error('Consultant Name is required'); return; }
      if (!c.number.trim()) { toast.error('Consultant Number is required'); return; }
      if (c.number.length !== 10) { toast.error('Consultant Number must be exactly 10 digits'); return; }
    }

    setLoading(true);
    const saved = upsertMobilization({ projectNo: formProject.serialNo, ...formData });
    setLoading(false);
    setFormProject(null);
    refresh();

    toast.success(
      isMobilizationComplete(saved)
        ? `${formProject.serialNo} mobilization complete — moved to History`
        : 'Mobilization details saved'
    );
  };

  const tableHeaders = [
    "Action", "Project No", "Project Type", "Project Name", "Contractor Name", "Contractor Phone No",
    "Contractor Gmail", "Project Location", "Start Date", "Planned End Date",
    "Work Order", "Work Order Date", "Irrigation Capacity", "Tender ID", "Tender Amount", "Accepted Amount",
    "Work Period", "Maintenance Period", "Higher Consultant", "Remarks"
  ];

  const renderRow = (item) => {
    const rec = recordFor(item.serialNo);
    return (
      <tr key={item.serialNo} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            onClick={() => openForm(item)}
            className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-indigo-100 transition-colors"
          >
            <ClipboardCheck size={12} /> {activeTab === 'history' ? 'View' : 'Update'}
          </button>
        </td>
        <td className="px-4 py-3 text-center text-[13px] text-indigo-600 font-bold whitespace-nowrap">{item.serialNo}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-700 whitespace-nowrap">{item.projectType || '-'}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-900 font-medium whitespace-nowrap">{item.projectName}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-700 whitespace-nowrap">{item.contractorName}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.contractorPhone}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.contractorEmail}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.projectLocation}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.startDate)}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.plannedEndDate)}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.workOrder || '-'}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.workOrderDate)}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.irrigationCapacity || '-'}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.tenderId || '-'}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">
          <div>{item.tenderAmount || '-'}</div>
          {amountInWords(item.tenderAmount) && (
            <div className="text-[9px] text-gray-400 italic truncate max-w-[160px] mx-auto" title={amountInWords(item.tenderAmount)}>{amountInWords(item.tenderAmount)}</div>
          )}
        </td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">
          <div>{item.acceptedAmount || '-'}</div>
          {amountInWords(item.acceptedAmount) && (
            <div className="text-[9px] text-gray-400 italic truncate max-w-[160px] mx-auto" title={amountInWords(item.acceptedAmount)}>{amountInWords(item.acceptedAmount)}</div>
          )}
        </td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.workPeriod || '-'}</td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.maintenancePeriod || '-'}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {rec?.consultants?.length > 0 ? (
            <InfoPopover
              items={rec.consultants.map(c => `${c.name} · ${c.number}`)}
              title={`Consultants — ${item.serialNo}`}
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded px-2 py-0.5 cursor-help hover:bg-emerald-200/60">
                <Users size={12} /> {rec.consultants.length}
              </span>
            </InfoPopover>
          ) : (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">Pending</span>
          )}
        </td>
        <td className="px-4 py-3 text-center text-[13px] text-gray-600">
          {rec?.remarks ? (
            <span className="block truncate max-w-[180px] mx-auto" title={rec.remarks}>{rec.remarks}</span>
          ) : '-'}
        </td>
      </tr>
    );
  };

  const renderCard = (item) => {
    const rec = recordFor(item.serialNo);
    return (
      <div key={item.serialNo} className="bg-white rounded-lg border border-indigo-50 shadow-sm p-3 space-y-2">
        <div className="flex justify-between items-start border-b border-gray-100 pb-2">
          <div>
            <span className="text-[9px] text-indigo-500 uppercase tracking-widest leading-none block mb-1">{item.serialNo}</span>
            <h4 className="text-sm text-gray-900 leading-tight">{item.projectName}</h4>
          </div>
          {item.projectType && (
            <span className="text-[8px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-tight whitespace-nowrap flex-shrink-0">
              {item.projectType}
            </span>
          )}
        </div>

        <div className="bg-slate-50 rounded p-2 text-[10px] space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Contractor:</span>
            <span className="text-gray-700">{item.contractorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <span className="text-gray-700">{item.contractorPhone || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Gmail:</span>
            <span className="text-gray-700 truncate max-w-[160px]">{item.contractorEmail || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-700">{item.projectLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Start / End:</span>
            <span className="text-gray-700">{formatDate(item.startDate)} - {formatDate(item.plannedEndDate)}</span>
          </div>
          {item.workOrder && (
            <div className="flex justify-between">
              <span className="text-gray-500">Work Order:</span>
              <span className="text-gray-700 truncate max-w-[140px]">{item.workOrder}</span>
            </div>
          )}
          {item.workOrderDate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Work Order Date:</span>
              <span className="text-gray-700">{formatDate(item.workOrderDate)}</span>
            </div>
          )}
          {item.irrigationCapacity && (
            <div className="flex justify-between">
              <span className="text-gray-500">Irrigation Capacity:</span>
              <span className="text-gray-700 truncate max-w-[140px]">{item.irrigationCapacity}</span>
            </div>
          )}
          {item.tenderId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tender ID:</span>
              <span className="text-gray-700 truncate max-w-[140px]">{item.tenderId}</span>
            </div>
          )}
          {item.tenderAmount && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tender Amount:</span>
              <span className="text-gray-700">{item.tenderAmount}</span>
            </div>
          )}
          {item.acceptedAmount && (
            <div className="flex justify-between">
              <span className="text-gray-500">Accepted Amount:</span>
              <span className="text-gray-700">{item.acceptedAmount}</span>
            </div>
          )}
          {(item.workPeriod || item.maintenancePeriod) && (
            <div className="flex justify-between">
              <span className="text-gray-500">Work / Maintenance:</span>
              <span className="text-gray-700">{item.workPeriod || '-'} / {item.maintenancePeriod || '-'}</span>
            </div>
          )}
        </div>

        <div className="text-[10px]" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-400 uppercase tracking-tighter text-[8px] mb-0.5">Higher Consultant</p>
          {rec?.consultants?.length > 0 ? (
            <InfoPopover
              items={rec.consultants.map(c => `${c.name} · ${c.number}`)}
              title={`Consultants — ${item.serialNo}`}
            >
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200 cursor-help">
                <Users size={10} /> {rec.consultants.length}
              </span>
            </InfoPopover>
          ) : (
            <span className="inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">Pending</span>
          )}
        </div>

        {rec?.remarks && (
          <div className="text-[10px] px-2 py-1.5 bg-slate-50 rounded border border-gray-100">
            <span className="text-gray-400 uppercase tracking-tighter text-[8px] block mb-0.5">Remarks</span>
            <span className="text-gray-700">{rec.remarks}</span>
          </div>
        )}

        <button
          onClick={() => openForm(item)}
          className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <ClipboardCheck size={12} /> {activeTab === 'history' ? 'View' : 'Update'}
        </button>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-3 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Tabs + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 px-2 sm:px-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 h-[34px] rounded-lg text-xs md:text-sm font-semibold border transition-colors ${
              activeTab === 'pending'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock size={14} /> Pending ({pendingProjects.length})
          </button>
          <button
            onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 h-[34px] rounded-lg text-xs md:text-sm font-semibold border transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <HistoryIcon size={14} /> History ({historyProjects.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
        <div className="flex-1 min-w-[160px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.searchQuery}
            onChange={(e) => { setFilters({ ...filters, searchQuery: e.target.value }); setCurrentPage(1); }}
            className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-xs sm:text-sm h-[34px]"
          />
        </div>
        <div className="w-full sm:w-44 flex-shrink-0">
          <SearchableDropdown
            options={Array.from(new Set(projects.map(p => p.projectName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
            value={filters.projectName}
            onChange={(val) => { setFilters({ ...filters, projectName: val }); setCurrentPage(1); }}
            placeholder="All Project Name"
            height="h-[34px]"
          />
        </div>
        <div className="w-full sm:w-44 flex-shrink-0">
          <SearchableDropdown
            options={Array.from(new Set(projects.map(p => p.contractorName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
            value={filters.contractorName}
            onChange={(val) => { setFilters({ ...filters, contractorName: val }); setCurrentPage(1); }}
            placeholder="All Contractor Name"
            height="h-[34px]"
          />
        </div>
        <div className="w-full sm:w-44 flex-shrink-0">
          <SearchableDropdown
            options={Array.from(new Set(projects.map(p => p.projectLocation))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
            value={filters.projectLocation}
            onChange={(val) => { setFilters({ ...filters, projectLocation: val }); setCurrentPage(1); }}
            placeholder="All Location"
            height="h-[34px]"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="flex items-center justify-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-full sm:w-[34px] h-[34px] hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
          title="Clear Filters"
        >
          <RotateCcw size={16} />
          <span className="sm:hidden text-xs font-semibold">Clear Filters</span>
        </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mx-2 sm:mx-0">
        <DataTable
          headers={tableHeaders}
          data={paginated}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="2900px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredList.length}
        />
      </div>

      {/* Mobilization Form Modal */}
      <ModalForm
        isOpen={!!formProject}
        onClose={() => setFormProject(null)}
        title={formProject ? `Mobilization — ${formProject.serialNo}` : ''}
        onSubmit={handleSubmit}
        submitText={loading ? 'Saving...' : 'Save'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {/* Project Info (read-only, pre-filled from the selected project) */}
          {formProject && (
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{formProject.projectName}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Project Type</p>
                  <p className="text-gray-700 truncate">{formProject.projectType || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Contractor</p>
                  <p className="text-gray-700 truncate">{formProject.contractorName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Contractor Phone</p>
                  <p className="text-gray-700 truncate">{formProject.contractorPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Contractor Gmail</p>
                  <p className="text-gray-700 truncate">{formProject.contractorEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Project Location</p>
                  <p className="text-gray-700 truncate">{formProject.projectLocation || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Start Date</p>
                  <p className="text-gray-700 truncate">{formatDate(formProject.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Planned End Date</p>
                  <p className="text-gray-700 truncate">{formatDate(formProject.plannedEndDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Work Order</p>
                  <p className="text-gray-700 truncate">{formProject.workOrder || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Work Order Date</p>
                  <p className="text-gray-700 truncate">{formatDate(formProject.workOrderDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Irrigation Capacity</p>
                  <p className="text-gray-700 truncate">{formProject.irrigationCapacity || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Tender ID</p>
                  <p className="text-gray-700 truncate">{formProject.tenderId || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Tender Amount</p>
                  <p className="text-gray-700 truncate">{formProject.tenderAmount || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Accepted Amount</p>
                  <p className="text-gray-700 truncate">{formProject.acceptedAmount || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Work Period</p>
                  <p className="text-gray-700 truncate">{formProject.workPeriod || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Maintenance Period</p>
                  <p className="text-gray-700 truncate">{formProject.maintenancePeriod || '-'}</p>
                </div>
              </div>
              {(amountInWords(formProject.tenderAmount) || amountInWords(formProject.acceptedAmount)) && (
                <div className="text-[10px] text-gray-500 italic space-y-0.5 pt-2 border-t border-gray-200">
                  {amountInWords(formProject.tenderAmount) && <p>Tender: {amountInWords(formProject.tenderAmount)}</p>}
                  {amountInWords(formProject.acceptedAmount) && <p>Accepted: {amountInWords(formProject.acceptedAmount)}</p>}
                </div>
              )}
            </div>
          )}

          {/* Higher Consultant */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-indigo-600" />
              <span className="text-[12px] md:text-[13px] font-semibold text-gray-800 uppercase tracking-tight">Higher Consultant</span>
            </div>

            <div className="space-y-2">
              {formData.consultants.map((c) => (
                <div key={c.id} className="grid grid-cols-2 gap-2 items-end bg-slate-50 border border-gray-200 rounded-lg p-2">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Consultant Name *</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => updateConsultantRow(c.id, 'name', e.target.value)}
                        placeholder="Enter consultant name"
                        className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px] bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Consultant Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={c.number}
                          onChange={(e) => updateConsultantRow(c.id, 'number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit number"
                          className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px] bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConsultantRow(c.id)}
                      className="flex-shrink-0 h-[30px] md:h-[34px] w-[30px] md:w-[34px] flex items-center justify-center text-red-500 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                      title="Remove consultant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addConsultantRow}
                className="flex items-center gap-1.5 text-[11px] md:text-[12px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100"
              >
                <Plus size={14} /> Add Consultant
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Add any remarks (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] resize-none"
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
