import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Info, RotateCcw, UploadCloud, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjects } from '../../utils/storageManager';
import DataTable from '../../components/DataTable';
import InfoPopover from '../../components/InfoPopover';
import SearchableDropdown from '../../components/SearchableDropdown';
import UploadDesign from './UploadDesign/UploadDesign';

export default function AllProject() {
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [projects, setProjects] = useState([]);
  const [uploadProject, setUploadProject] = useState(null);

  const initialFilters = {
    searchQuery: '',
    projectName: '',
    contractorName: '',
    projectLocation: ''
  };
  const [filters, setFilters] = useState({ ...initialFilters });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleClearFilters = () => {
    setFilters({ ...initialFilters });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const filteredProjects = projects.filter(p => {
    if (filters.projectName && p.projectName !== filters.projectName) return false;
    if (filters.contractorName && p.contractorName !== filters.contractorName) return false;
    if (filters.projectLocation && p.projectLocation !== filters.projectLocation) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      return (
        p.serialNo.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.contractorName.toLowerCase().includes(q) ||
        p.contractorPhone.toLowerCase().includes(q) ||
        p.contractorEmail.toLowerCase().includes(q) ||
        p.projectLocation.toLowerCase().includes(q)
      );
    }
    return true;
  }).reverse();

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Project No", "Upload", "Project Name", "Contractor Name", "Contractor Phone No",
    "Contractor Gmail", "Project Location", "Start Date", "Planned End Date", "Description", "Action"
  ];

  const renderRow = (item) => (
    <tr key={item.serialNo} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
      <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.serialNo}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <button
          onClick={() => setUploadProject(item)}
          className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-indigo-100 transition-colors"
        >
          <UploadCloud size={12} /> Upload
        </button>
      </td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-900 font-medium whitespace-nowrap">{item.projectName}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-700 whitespace-nowrap">{item.contractorName}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.contractorPhone}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.contractorEmail}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.projectLocation}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.startDate}</td>
      <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.plannedEndDate}</td>
      <td className="px-4 py-3 text-left whitespace-nowrap">
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
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <button
          onClick={() => navigate(`/view-design/${encodeURIComponent(item.serialNo)}`)}
          className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-gray-100 hover:text-indigo-600 transition-colors"
        >
          <Eye size={12} /> View
        </button>
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
        <div className="flex justify-between">
          <span className="text-gray-500">Location:</span>
          <span className="text-gray-700">{item.projectLocation}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Start / End:</span>
          <span className="text-gray-700">{item.startDate} - {item.plannedEndDate}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setUploadProject(item)}
          className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <UploadCloud size={12} /> Upload
        </button>
        <button
          onClick={() => navigate(`/view-design/${encodeURIComponent(item.serialNo)}`)}
          className="flex-1 bg-gray-50 text-gray-600 border border-gray-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <Eye size={12} /> View
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full">
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
          <div className="col-span-2">
            <SearchableDropdown
              options={Array.from(new Set(projects.map(p => p.projectLocation))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
              value={filters.projectLocation}
              onChange={(val) => { setFilters({ ...filters, projectLocation: val }); setCurrentPage(1); }}
              placeholder="All Location"
              height="h-[32px]"
            />
          </div>
        </div>

        {/* Desktop Row: Search + Dropdowns share equal width, reset button stays fixed */}
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
          <div className="flex-1 min-w-0">
            <SearchableDropdown
              options={Array.from(new Set(projects.map(p => p.projectLocation))).filter(Boolean).sort().map(v => ({ value: v, label: v }))}
              value={filters.projectLocation}
              onChange={(val) => { setFilters({ ...filters, projectLocation: val }); setCurrentPage(1); }}
              placeholder="All Location"
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
      </div>

      {/* Main Content - Using DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedProjects}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1550px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredProjects.length}
        />
      </div>

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
