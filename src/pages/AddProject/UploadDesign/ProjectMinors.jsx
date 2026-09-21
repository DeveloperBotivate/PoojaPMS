import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, FileText, Calendar, Tag, FileUp, Search } from 'lucide-react';
import { getMinors, getProjectOrMinor, deleteMinor } from '../../../utils/storageManager';
import ModalAlert from '../../../components/ModalAlert';
import AddMinorModal from './AddMinorModal';
import MinorCard from './MinorCard';

export default function ProjectMinors() {
  const { projectNo } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [minors, setMinors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMinorModal, setShowAddMinorModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const refreshMinors = (decodedNo) => {
    setMinors(getMinors().filter(m => m.projectNo === decodedNo));
  };

  useEffect(() => {
    const decodedNo = decodeURIComponent(projectNo || '');
    const found = getProjectOrMinor(decodedNo);
    setProject(found || null);
    refreshMinors(decodedNo);
  }, [projectNo]);

  const confirmDeleteMinor = () => {
    if (!deleteTarget) return;
    deleteMinor(deleteTarget.id);
    setDeleteTarget(null);
    refreshMinors(project.serialNo);
    toast.success(`"${deleteTarget.minorName}" deleted`);
  };

  if (!project) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => navigate('/upload-design')}
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

  const filteredMinors = minors.filter(m => 
    m.minorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-3 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Row 1: Back + Search + Add Minor */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full px-2 sm:px-0">
        <button
          onClick={() => navigate('/upload-design')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold w-fit flex-shrink-0"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex-1 flex items-center min-w-0 relative">
          <Search className="absolute left-2.5 top-[9px] md:top-[11px] text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search miners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-white border border-gray-300 rounded-lg md:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-xs md:text-sm h-[32px] md:h-[38px]"
          />
        </div>

        <button
          onClick={() => setShowAddMinorModal(true)}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-4 h-[32px] md:h-[38px] text-xs md:text-sm font-semibold shadow-sm transition flex-shrink-0"
        >
          <FileUp size={16} /> Add Miner
        </button>
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
            <FileText size={20} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Project Description</p>
              <p className="text-base md:text-lg text-gray-900 font-bold truncate" title={project.projectDescription}>{project.projectDescription || '-'}</p>
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

      {/* Minors Grid */}
      <div className="mx-2 sm:mx-0 flex-1">
        {filteredMinors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMinors.map(minor => (
              <MinorCard key={minor.id} minor={minor} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 border-dashed shadow-sm p-12 text-center text-gray-500">
            <FileUp size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-600 mb-1">No Miners Added Yet</p>
            <p className="text-sm">Click "Add Miner" to create one and upload its design.</p>
          </div>
        )}
      </div>

      {/* Add Minor Modal */}
      <AddMinorModal
        isOpen={showAddMinorModal}
        onClose={() => setShowAddMinorModal(false)}
        project={project}
        onSaved={() => {
          setShowAddMinorModal(false);
          refreshMinors(project.serialNo);
        }}
      />

      {/* Delete Minor Confirmation */}
      <ModalAlert
        isOpen={!!deleteTarget}
        type="confirm"
        title="Delete this minor?"
        message={deleteTarget ? `"${deleteTarget.minorName}" and all its design/execution/actual data will be permanently removed.` : ''}
        onConfirm={confirmDeleteMinor}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
