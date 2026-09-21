import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileUp, Calendar, UploadCloud, Check, Eye, Clock, History as HistoryIcon, Search, RotateCcw } from 'lucide-react';
import {
  getProjects,
  getSurveys,
  isSurveyComplete,
  getDrawingUploads,
  upsertDrawingUpload,
  isDrawingUploadComplete
} from '../../utils/storageManager';
import { amountInWords, fileToBase64, compressImageToBase64 } from '../../utils/helpers';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';

// Format YYYY-MM-DD -> DD/MM/YYYY for display
const formatDate = (val) => {
  if (!val) return '-';
  const parts = val.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
};

const initialFormData = {
  drawingDate: '',
  drawingFile: '',
  drawingFileName: '',
  remarks: ''
};

const initialFilters = { searchQuery: '', projectName: '', contractorName: '', projectLocation: '' };

export default function DrawingUpload() {
  const [projects, setProjects] = useState([]);
  const [surveyRecords, setSurveyRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [formProject, setFormProject] = useState(null);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ ...initialFilters });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const refresh = () => {
    // Only projects with a completed Survey (sitting in that page's History tab) are
    // eligible for drawing upload at this stage.
    const surveys = getSurveys();
    const eligibleProjects = getProjects().filter(p => {
      const rec = surveys.find(s => s.projectNo === p.serialNo);
      return isSurveyComplete(rec);
    });
    setProjects(eligibleProjects);
    setSurveyRecords(surveys);
    setRecords(getDrawingUploads());
  };

  useEffect(() => { refresh(); }, []);

  const surveyFor = (projectNo) => surveyRecords.find(s => s.projectNo === projectNo) || null;
  const recordFor = (projectNo) => records.find(r => r.projectNo === projectNo) || null;

  const pendingProjects = projects.filter(p => !isDrawingUploadComplete(recordFor(p.serialNo))).reverse();
  const historyProjects = projects.filter(p => isDrawingUploadComplete(recordFor(p.serialNo))).reverse();

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
    setFormData(rec ? {
      drawingDate: rec.drawingDate || '',
      drawingFile: rec.drawingFile || '',
      drawingFileName: rec.drawingFileName || '',
      remarks: rec.remarks || ''
    } : { ...initialFormData });
    setFormProject(project);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleDrawingFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_UPLOAD = 50 * 1024 * 1024; // 50MB - accepted at selection time
    const MAX_STORED = 2 * 1024 * 1024;  // 2MB - what actually gets saved

    if (file.size > MAX_UPLOAD) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const { base64, size } = await compressImageToBase64(file, { maxBytes: MAX_STORED });
        setFormData(prev => ({ ...prev, drawingFile: base64, drawingFileName: file.name }));
        toast.success(
          size <= MAX_STORED
            ? `Attached (compressed to ${(size / 1024 / 1024).toFixed(2)}MB)`
            : `Attached (${(size / 1024 / 1024).toFixed(2)}MB - could not compress further)`
        );
      } else {
        if (file.size > MAX_STORED) {
          toast.error('PDF files cannot be auto-compressed - please upload a PDF under 2MB, or use an image instead');
          return;
        }
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, drawingFile: base64, drawingFileName: file.name }));
        toast.success('Drawing file attached');
      }
    } catch (error) {
      toast.error('Error reading file');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.drawingDate) { toast.error('Drawing Date is required'); return; }

    setLoading(true);
    upsertDrawingUpload({ projectNo: formProject.serialNo, ...formData });
    setLoading(false);
    setFormProject(null);
    refresh();

    toast.success(`${formProject.serialNo} drawing uploaded — moved to History`);
  };

  const tableHeaders = [
    "Action", "Project No", "Project Type", "Project Name", "Contractor Name", "Contractor Phone No",
    "Contractor Gmail", "Project Location", "Start Date", "Planned End Date",
    "Work Order", "Work Order Date", "Irrigation Capacity", "Tender ID", "Tender Amount", "Accepted Amount",
    "Work Period", "Maintenance Period", "Survey", "Drawing Status"
  ];

  const renderRow = (item) => {
    const survey = surveyFor(item.serialNo);
    const rec = recordFor(item.serialNo);
    return (
      <tr key={item.serialNo} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            onClick={() => openForm(item)}
            className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-indigo-100 transition-colors"
          >
            <FileUp size={12} /> {activeTab === 'history' ? 'View' : 'Upload'}
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
        <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">
          {survey ? (
            <span className={`text-[10px] font-semibold ${survey.drawingReady === 'yes' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {survey.drawingReady === 'yes' ? 'Ready' : 'Not Ready'}
            </span>
          ) : '-'}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          {rec && isDrawingUploadComplete(rec) ? (
            <div>
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200">Uploaded</span>
              <div className="text-[10px] text-gray-500 mt-1">{formatDate(rec.drawingDate)}</div>
            </div>
          ) : (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">Pending</span>
          )}
        </td>
      </tr>
    );
  };

  const renderCard = (item) => {
    const survey = surveyFor(item.serialNo);
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
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-700">{item.projectLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Start / End:</span>
            <span className="text-gray-700">{formatDate(item.startDate)} - {formatDate(item.plannedEndDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Survey Drawing:</span>
            <span className={survey?.drawingReady === 'yes' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {survey ? (survey.drawingReady === 'yes' ? 'Ready' : 'Not Ready') : '-'}
            </span>
          </div>
        </div>

        <div className="text-[10px]">
          <p className="text-gray-400 uppercase tracking-tighter text-[8px] mb-0.5">Drawing Status</p>
          {rec && isDrawingUploadComplete(rec) ? (
            <div>
              <span className="inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border bg-emerald-100 text-emerald-700 border-emerald-200">Uploaded</span>
              <span className="text-gray-500 ml-1.5">{formatDate(rec.drawingDate)}</span>
            </div>
          ) : (
            <span className="inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">Pending</span>
          )}
        </div>

        <button
          onClick={() => openForm(item)}
          className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <FileUp size={12} /> {activeTab === 'history' ? 'View' : 'Upload'}
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

      {/* Drawing Upload Modal */}
      <ModalForm
        isOpen={!!formProject}
        onClose={() => setFormProject(null)}
        title={formProject ? `Drawing Upload — ${formProject.serialNo}` : ''}
        onSubmit={handleSubmit}
        submitText={loading ? 'Saving...' : 'Save'}
        maxWidth="max-w-xl"
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
                  <p className="text-gray-400 uppercase tracking-tighter text-[9px]">Survey Drawing</p>
                  <p className={`truncate ${surveyFor(formProject.serialNo)?.drawingReady === 'yes' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}`}>
                    {surveyFor(formProject.serialNo) ? (surveyFor(formProject.serialNo).drawingReady === 'yes' ? 'Ready' : 'Not Ready') : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drawing Details */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FileUp size={14} className="text-indigo-600" />
              <span className="text-[12px] md:text-[13px] font-semibold text-gray-800 uppercase tracking-tight">Drawing Details</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Drawing Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  <input
                    type="date"
                    value={formData.drawingDate}
                    onChange={(e) => handleChange('drawingDate', e.target.value)}
                    className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Upload Drawing File</label>
                <label className="cursor-pointer block">
                  <div className={`flex items-center justify-center gap-2 border border-dashed rounded h-[30px] md:h-[34px] transition-all
                    ${formData.drawingFileName ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'}
                  `}>
                    {formData.drawingFileName ? <Check size={14} /> : <UploadCloud size={14} />}
                    <span className="text-[11px] md:text-[13px] truncate max-w-[80%]">
                      {formData.drawingFileName || 'Click to browse (Image up to 50MB, auto-compressed to 2MB / PDF up to 2MB)'}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleDrawingFile}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                {formData.drawingFile && (
                  <a
                    href={formData.drawingFile}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:underline"
                  >
                    <Eye size={11} /> Preview uploaded file
                  </a>
                )}
              </div>

              <div className="space-y-1 col-span-2">
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
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
