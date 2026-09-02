import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User, Phone, Mail, MapPin, Calendar,
  FileText, Building2
} from 'lucide-react';
import { updateProject } from '../../utils/storageManager';
import ModalForm from '../../components/ModalForm';

/**
 * Edit_Add_Project
 * Pop-up modal that pre-fills all project fields for editing.
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – fn()
 *   project   – the project object to edit
 *   onUpdated – fn() called after a successful save so parent can refresh
 */
export default function Edit_Add_Project({ isOpen, onClose, project, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    contractorName: '',
    contractorPhone: '',
    contractorEmail: '',
    projectLocation: '',
    startDate: '',
    plannedEndDate: '',
    projectDescription: ''
  });

  // Populate form whenever the modal opens with a new project
  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || '',
        contractorName: project.contractorName || '',
        contractorPhone: project.contractorPhone || '',
        contractorEmail: project.contractorEmail || '',
        projectLocation: project.projectLocation || '',
        startDate: project.startDate || '',
        plannedEndDate: project.plannedEndDate || '',
        projectDescription: project.projectDescription || ''
      });
    }
  }, [project]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.projectName.trim()) { toast.error('Project Name is required'); return; }
    if (!formData.contractorName.trim()) { toast.error('Contractor Name is required'); return; }
    if (!formData.contractorPhone.trim()) { toast.error('Contractor Phone No is required'); return; }
    if (formData.contractorPhone.length !== 10) { toast.error('Contractor Phone No must be exactly 10 digits'); return; }
    if (!formData.contractorEmail.trim()) { toast.error('Contractor Gmail is required'); return; }
    if (!formData.projectLocation.trim()) { toast.error('Project Location is required'); return; }
    if (!formData.startDate) { toast.error('Start Date is required'); return; }
    if (!formData.plannedEndDate) { toast.error('Planned End Date is required'); return; }

    setLoading(true);

    const updated = {
      ...project,
      ...formData,
      updatedAt: new Date().toISOString()
    };

    updateProject(updated);
    toast.success(`Project ${project.serialNo} updated successfully`);
    setLoading(false);
    onUpdated?.();
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Project — ${project.serialNo}`}
      onSubmit={handleSubmit}
      submitText={loading ? 'Saving...' : 'Update'}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-2 md:gap-4">

        {/* Project Name */}
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

        {/* Contractor Name */}
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

        {/* Contractor Phone */}
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

        {/* Contractor Gmail */}
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

        {/* Project Location */}
        <div className="space-y-1 col-span-2">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Project Location *</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={formData.projectLocation}
              onChange={(e) => handleChange('projectLocation', e.target.value)}
              placeholder="Enter project location"
              className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
            />
          </div>
        </div>

        {/* Start Date */}
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

        {/* Planned End Date */}
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

        {/* Description */}
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
  );
}
