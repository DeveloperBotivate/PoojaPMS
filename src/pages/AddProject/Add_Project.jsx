import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, Search, User, Phone, Mail, MapPinned, Calendar,
  FileText, Building2, Info, Filter, RotateCcw, Pencil, Trash2, UploadCloud, Eye, Check,
  ClipboardList, Hash, IndianRupee, CalendarRange, Wrench, Droplet,
  Landmark, GitBranch, FolderTree
} from 'lucide-react';
import { getProjects, saveProject, deleteProject } from '../../utils/storageManager';
import { amountInWords, fileToBase64, compressImageToBase64 } from '../../utils/helpers';
import ModalForm from '../../components/ModalForm';
import DataTable from '../../components/DataTable';
import ModalAlert from '../../components/ModalAlert';
import InfoPopover from '../../components/InfoPopover';
import SearchableDropdown from '../../components/SearchableDropdown';
import Edit_Add_Project from './Edit_Add_Project';
import UploadDesign from './UploadDesign/UploadDesign';
import { PROJECT_TYPES } from './projectConstants';

export default function AddProject() {
  const navigate = useNavigate();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editProject, setEditProject] = useState(null); // project being edited
  const [uploadProject, setUploadProject] = useState(null); // project being uploaded design for

  const initialFilters = {
    searchQuery: '',
    projectName: '',
    contractorName: ''
  };
  const [filters, setFilters] = useState({ ...initialFilters });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const initialFormData = {
    projectType: '',
    projectName: '',
    department: '',
    division: '',
    subDivision: '',
    contractorName: 'Pooja Construction',
    contractorPhone: '8275149683',
    contractorEmail: 'daftarigroup@gmail.com',
    contractorAddress: '104, 1ST FLOOR, BEHIND DAFTARI ARCADE, DHUNIWALE CHOWK, DAFTARI BUILDING, NAGPUR ROAD, WARDHA',
    startDate: '',
    plannedEndDate: '',
    workOrder: '',
    workOrderDate: '',
    workOrderDocument: '',
    workOrderDocumentName: '',
    irrigationCapacity: '',
    tenderId: '',
    tenderAmount: '',
    acceptedAmount: '',
    workPeriod: '',
    maintenancePeriod: '',
    projectDescription: ''
  };

  const [formData, setFormData] = useState({ ...initialFormData });

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkOrderDocument = async (e) => {
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
        // Images are resized/re-encoded down to ~2MB so large phone photos don't bloat storage
        const { base64, size } = await compressImageToBase64(file, { maxBytes: MAX_STORED });
        setFormData(prev => ({ ...prev, workOrderDocument: base64, workOrderDocumentName: file.name }));
        toast.success(
          size <= MAX_STORED
            ? `Attached (compressed to ${(size / 1024 / 1024).toFixed(2)}MB)`
            : `Attached (${(size / 1024 / 1024).toFixed(2)}MB - could not compress further)`
        );
      } else {
        // PDFs can't be compressed client-side, so they must already be under the stored limit
        if (file.size > MAX_STORED) {
          toast.error('PDF files cannot be auto-compressed - please upload a PDF under 2MB, or use an image instead');
          return;
        }
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, workOrderDocument: base64, workOrderDocumentName: file.name }));
        toast.success('Work Order document attached');
      }
    } catch (error) {
      toast.error('Error reading file');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.projectType) {
      toast.error('Project Type is required');
      return;
    }
    if (!formData.projectName.trim()) {
      toast.error('Project Name is required');
      return;
    }
    if (!formData.contractorName.trim()) {
      toast.error('Contractor Name is required');
      return;
    }
    if (!formData.contractorPhone.trim()) {
      toast.error('Contractor Phone No is required');
      return;
    }
    if (formData.contractorPhone.length !== 10) {
      toast.error('Contractor Phone No must be exactly 10 digits');
      return;
    }
    if (!formData.contractorEmail.trim()) {
      toast.error('Contractor Gmail is required');
      return;
    }
    if (!formData.contractorAddress.trim()) {
      toast.error('Contractor Address is required');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start Date is required');
      return;
    }
    if (!formData.plannedEndDate) {
      toast.error('Planned End Date is required');
      return;
    }

    setLoading(true);

    const allProjects = getProjects();
    const nextSn = allProjects.length + 1;
    const serialNo = `PN-${String(nextSn).padStart(3, '0')}`;
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newProject = {
      id: serialNo,
      serialNo,
      timestamp,
      ...formData,
      tenderAmountWords: amountInWords(formData.tenderAmount),
      acceptedAmountWords: amountInWords(formData.acceptedAmount)
    };

    saveProject(newProject);
    setProjects(getProjects());

    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Project Added!',
      message: `Project ${serialNo} has been successfully created.`
    });

    setFormData({ ...initialFormData });
    setShowFormModal(false);
    setLoading(false);
  };

  const handleClearFilters = () => {
    setFilters({ ...initialFilters });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Delete project ${item.serialNo} "${item.projectName}"? This cannot be undone.`)) return;
    deleteProject(item.id);
    setProjects(getProjects());
    toast.success(`Project ${item.serialNo} deleted`);
  };

  const filteredProjects = projects.filter(p => {
    if (filters.projectName && p.projectName !== filters.projectName) return false;
    if (filters.contractorName && p.contractorName !== filters.contractorName) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return (
        p.serialNo.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.contractorName.toLowerCase().includes(q) ||
        p.contractorPhone.toLowerCase().includes(q) ||
        p.contractorEmail.toLowerCase().includes(q) ||
        (p.contractorAddress || '').toLowerCase().includes(q)
      );
    }
    return true;
  }).reverse();

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format YYYY-MM-DD → DD/MM/YYYY for display
  const formatDate = (val) => {
    if (!val) return '-';
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return val;
  };

  const tableHeaders = [
    "Project No", "Project Type", "Project Name", "Department", "Division", "Sub-Division", "Contractor Name", "Contractor Phone No",
    "Contractor Gmail", "Contractor Address", "Start Date", "Planned End Date",
    "Work Order", "Work Order Date", "Work Order Document", "Irrigation Capacity", "Tender ID", "Tender Amount", "Accepted Amount",
    "Work Period", "Maintenance Period", "Description", "Action"
  ];

  const renderRow = (item) => (
    <tr
      key={item.serialNo}
      onClick={() => navigate(`/view-design/${encodeURIComponent(item.serialNo)}`)}
      className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-100 cursor-pointer"
    >
      <td className="px-4 py-3 text-center text-[14px] text-indigo-600 font-bold whitespace-nowrap">{item.serialNo}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-700 whitespace-nowrap">{item.projectType || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-900 font-medium whitespace-nowrap">{item.projectName}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.department || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.division || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.subDivision || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-700 whitespace-nowrap">{item.contractorName}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.contractorPhone}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.contractorEmail}</td>
      <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {item.contractorAddress ? (
          <InfoPopover items={[item.contractorAddress]} title="Contractor Address">
            <span className="text-[11px] text-gray-500 flex items-center gap-1 cursor-help hover:text-indigo-600">
              <Info size={12} /> View Info
            </span>
          </InfoPopover>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.startDate)}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.plannedEndDate)}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.workOrder || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{formatDate(item.workOrderDate)}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {item.workOrderDocument ? (
          <a
            href={item.workOrderDocument}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-indigo-600 hover:text-indigo-800"
          >
            <Eye size={12} /> View
          </a>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.irrigationCapacity || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.tenderId || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">
        <div>{item.tenderAmount || '-'}</div>
        {item.tenderAmountWords && (
          <div className="text-[9px] text-gray-400 italic truncate max-w-[160px] mx-auto" title={item.tenderAmountWords}>{item.tenderAmountWords}</div>
        )}
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">
        <div>{item.acceptedAmount || '-'}</div>
        {item.acceptedAmountWords && (
          <div className="text-[9px] text-gray-400 italic truncate max-w-[160px] mx-auto" title={item.acceptedAmountWords}>{item.acceptedAmountWords}</div>
        )}
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.workPeriod || '-'}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-600 whitespace-nowrap">{item.maintenancePeriod || '-'}</td>
      <td className="px-4 py-3 text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {item.projectDescription ? (
          <InfoPopover items={[item.projectDescription]} title="Project Description">
            <span className="text-[11px] text-gray-500 flex items-center gap-1 cursor-help hover:text-indigo-600">
              <Info size={12} /> View Info
            </span>
          </InfoPopover>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </td>
      {/* Action column */}
      <td
        className="px-3 py-2 text-center whitespace-nowrap bg-white group-hover:bg-indigo-50 transition-colors"
        style={{ position: 'sticky', right: 0, zIndex: 10, boxShadow: '-2px 0 4px rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setEditProject(item)}
            title="Edit Project"
            className="inline-flex items-center justify-center p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => handleDelete(item)}
            title="Delete Project"
            className="inline-flex items-center justify-center p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderCard = (item) => (
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

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-gray-400 uppercase tracking-tighter text-[8px]">Contractor</p>
          <p className="text-gray-700 truncate leading-tight">{item.contractorName}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-tighter text-[8px]">Phone</p>
          <p className="text-gray-700 truncate leading-tight">{item.contractorPhone}</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded p-2 text-[10px] space-y-1">
        {(item.department || item.division || item.subDivision) && (
          <div className="flex justify-between">
            <span className="text-gray-500">Dept / Div / Sub-Div:</span>
            <span className="text-gray-700 truncate max-w-[160px]">{item.department || '-'} / {item.division || '-'} / {item.subDivision || '-'}</span>
          </div>
        )}
        {item.contractorAddress && (
          <div className="flex justify-between">
            <span className="text-gray-500">Contractor Address:</span>
            <span className="text-gray-700 truncate max-w-[160px]">{item.contractorAddress}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Start / End:</span>
          <span className="text-gray-700">{item.startDate} - {item.plannedEndDate}</span>
        </div>
        {item.workOrder && (
          <div className="flex justify-between">
            <span className="text-gray-500">Work Order:</span>
            <span className="text-gray-700 truncate max-w-[140px]">{item.workOrder}</span>
          </div>
        )}
        {item.workOrderDocument && (
          <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-gray-500">Work Order Doc:</span>
            <a
              href={item.workOrderDocument}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-indigo-600"
            >
              <Eye size={11} /> View
            </a>
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

      <div className="flex gap-1.5">
        <button
          onClick={() => setUploadProject(item)}
          className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1"
        >
          <UploadCloud size={11} /> Upload
        </button>
        <button
          onClick={() => navigate(`/view-design/${encodeURIComponent(item.serialNo)}`)}
          className="flex-1 bg-gray-50 text-gray-600 border border-gray-200 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1"
        >
          <Eye size={11} /> View
        </button>
        <button
          onClick={() => setEditProject(item)}
          className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={() => handleDelete(item)}
          className="flex-1 bg-red-50 text-red-600 border border-red-200 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1"
        >
          <Trash2 size={11} /> Del
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full px-2 sm:px-0">
        {/* Mobile Top Bar */}
        <div className="flex items-center gap-2 w-full lg:hidden">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.searchQuery}
              onChange={(e) => { setFilters({ ...filters, searchQuery: e.target.value }); setCurrentPage(1); }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-xs h-[32px]"
            />
          </div>
          <button
             onClick={() => setShowMobileFilters(!showMobileFilters)}
             className={`flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter size={14} />
          </button>
          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
            title="Clear Filters"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center h-[32px] w-[32px] flex-shrink-0 shadow-sm transition"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Mobile Collapsible Filters */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:hidden grid-cols-2 gap-2 w-full`}>
          <SearchableDropdown
            options={Array.from(new Set(projects.map(p => p.projectName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
            value={filters.projectName}
            onChange={(val) => { setFilters({ ...filters, projectName: val }); setCurrentPage(1); }}
            placeholder="All Project Name"
            height="h-[32px]"
          />
          <SearchableDropdown
            options={Array.from(new Set(projects.map(p => p.contractorName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
            value={filters.contractorName}
            onChange={(val) => { setFilters({ ...filters, contractorName: val }); setCurrentPage(1); }}
            placeholder="All Contractor Name"
            height="h-[32px]"
          />
        </div>

        {/* Desktop Row: Search + Dropdowns share equal width, buttons stay fixed */}
        <div className="hidden lg:flex lg:flex-1 items-center gap-3">
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-2.5 top-[11px] text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.searchQuery}
              onChange={(e) => { setFilters({ ...filters, searchQuery: e.target.value }); setCurrentPage(1); }}
              className="w-full bg-white border border-gray-300 rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-sm h-[38px]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              options={Array.from(new Set(projects.map(p => p.projectName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
              value={filters.projectName}
              onChange={(val) => { setFilters({ ...filters, projectName: val }); setCurrentPage(1); }}
              placeholder="All Project Name"
              height="h-[38px]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              options={Array.from(new Set(projects.map(p => p.contractorName))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
              value={filters.contractorName}
              onChange={(val) => { setFilters({ ...filters, contractorName: val }); setCurrentPage(1); }}
              placeholder="All Contractor Name"
              height="h-[38px]"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
            title="Clear Filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <button
          onClick={() => setShowFormModal(true)}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center gap-2 transition shadow-sm h-[38px] px-4 flex-shrink-0"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold whitespace-nowrap">Add Project</span>
        </button>
      </div>

      {/* Modal Form */}
      <ModalForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Add New Project"
        onSubmit={handleSubmit}
        submitText={loading ? 'Saving...' : 'Save'}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Project Type *</label>
            <SearchableDropdown
              options={PROJECT_TYPES.map(v => ({ value: v, label: v }))}
              value={formData.projectType}
              onChange={(val) => handleChange('projectType', val)}
              placeholder="Select project type"
              height="h-[30px] md:h-[34px]"
            />
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Project Name *</label>
            <div className="relative">
              <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleChange('projectName', e.target.value)}
                placeholder="Enter project name"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Department</label>
            <div className="relative">
              <Landmark className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Enter department"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Division</label>
            <div className="relative">
              <GitBranch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.division}
                onChange={(e) => handleChange('division', e.target.value)}
                placeholder="Enter division"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Sub-Division</label>
            <div className="relative">
              <FolderTree className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.subDivision}
                onChange={(e) => handleChange('subDivision', e.target.value)}
                placeholder="Enter sub-division"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Contractor Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.contractorName}
                onChange={(e) => handleChange('contractorName', e.target.value)}
                placeholder="Enter contractor name"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Contractor Phone No *</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={formData.contractorPhone}
                onChange={(e) => handleChange('contractorPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Contractor Gmail *</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="email"
                value={formData.contractorEmail}
                onChange={(e) => handleChange('contractorEmail', e.target.value)}
                placeholder="Enter email address"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Contractor Address *</label>
            <div className="relative">
              <MapPinned className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <textarea
                value={formData.contractorAddress}
                onChange={(e) => handleChange('contractorAddress', e.target.value)}
                placeholder="Enter contractor address"
                rows={2}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] resize-none"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Start Date *</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Planned End Date *</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              <input
                type="date"
                value={formData.plannedEndDate}
                onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="col-span-2 pt-1">
            <p className="text-[10px] md:text-[11px] font-bold text-indigo-500 uppercase tracking-widest border-t border-gray-100 pt-2">Work Order &amp; Tender Details</p>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Work Order</label>
            <div className="relative">
              <ClipboardList className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.workOrder}
                onChange={(e) => handleChange('workOrder', e.target.value)}
                placeholder="Enter work order no."
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Work Order Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              <input
                type="date"
                value={formData.workOrderDate}
                onChange={(e) => handleChange('workOrderDate', e.target.value)}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Upload Work Order Document</label>
            <label className="cursor-pointer block">
              <div className={`flex items-center justify-center gap-2 border border-dashed rounded h-[30px] md:h-[34px] transition-all
                ${formData.workOrderDocumentName ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'}
              `}>
                {formData.workOrderDocumentName ? <Check size={14} /> : <UploadCloud size={14} />}
                <span className="text-[11px] md:text-[13px] truncate max-w-[80%]">
                  {formData.workOrderDocumentName || 'Click to browse (Image up to 50MB, auto-compressed to 2MB / PDF up to 2MB)'}
                </span>
              </div>
              <input
                type="file"
                onChange={handleWorkOrderDocument}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Irrigation Capacity</label>
            <div className="relative">
              <Droplet className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.irrigationCapacity}
                onChange={(e) => handleChange('irrigationCapacity', e.target.value)}
                placeholder="e.g. 500 Hectares"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Tender ID</label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.tenderId}
                onChange={(e) => handleChange('tenderId', e.target.value)}
                placeholder="Enter tender ID"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Tender Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tenderAmount}
                onChange={(e) => handleChange('tenderAmount', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Enter tender amount"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Accepted Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.acceptedAmount}
                onChange={(e) => handleChange('acceptedAmount', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Enter accepted amount"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Tender Amount In Words</label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-1.5 text-[10px] md:text-[12px] text-gray-500 italic min-h-[30px] md:min-h-[34px] flex items-center">
              {amountInWords(formData.tenderAmount) || 'Auto-generated from Tender Amount'}
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Accepted Amount In Words</label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-1.5 text-[10px] md:text-[12px] text-gray-500 italic min-h-[30px] md:min-h-[34px] flex items-center">
              {amountInWords(formData.acceptedAmount) || 'Auto-generated from Accepted Amount'}
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Work Period</label>
            <div className="relative">
              <CalendarRange className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.workPeriod}
                onChange={(e) => handleChange('workPeriod', e.target.value)}
                placeholder="e.g. 12 Months"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Maintenance Period</label>
            <div className="relative">
              <Wrench className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.maintenancePeriod}
                onChange={(e) => handleChange('maintenancePeriod', e.target.value)}
                placeholder="e.g. 24 Months"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1 col-span-2">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Project Description</label>
            <div className="relative">
              <FileText className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <textarea
                value={formData.projectDescription}
                onChange={(e) => handleChange('projectDescription', e.target.value)}
                placeholder="Enter project description"
                rows={3}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] resize-none"
              />
            </div>
          </div>
        </div>
      </ModalForm>

      {/* Main Content */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedProjects}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="3300px"
          stickyFirstColumn
          stickyLastColumn
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredProjects.length}
        />
      </div>

      {/* Success/Error Alert */}
      <ModalAlert
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />

      {/* Edit Project Modal */}
      <Edit_Add_Project
        isOpen={!!editProject}
        onClose={() => setEditProject(null)}
        project={editProject}
        onUpdated={() => setProjects(getProjects())}
      />

      {/* Upload Design Modal */}
      <UploadDesign
        isOpen={!!uploadProject}
        onClose={() => setUploadProject(null)}
        project={uploadProject}
        onUploaded={() => setUploadProject(null)}
      />
    </div>
  );
}
