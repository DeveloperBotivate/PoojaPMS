import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Pencil, Trash2, Search, Shield, User as UserIcon, Eye, EyeOff, Lock, IdCard } from 'lucide-react';
import { getUsers, upsertUser, deleteUser } from '../../utils/storageManager';
import { useAuthStore } from '../../store/authStore';
import ModalForm from '../../components/ModalForm';
import ModalAlert from '../../components/ModalAlert';
import DataTable from '../../components/DataTable';

const initialFormData = { id: '', name: '', password: '', role: 'USER' };

export default function Settings() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null); // null = adding a new user
  const [formData, setFormData] = useState({ ...initialFormData });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, targetUser: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const refresh = () => setUsers(getUsers());

  useEffect(() => { refresh(); }, []);

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  const openAddForm = () => {
    setFormData({ ...initialFormData });
    setEditUserId(null);
    setShowPassword(false);
    setShowFormModal(true);
  };

  const openEditForm = (u) => {
    setFormData({ id: u.id, name: u.name, password: '', role: u.role || 'USER' });
    setEditUserId(u.id);
    setShowPassword(false);
    setShowFormModal(true);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const id = formData.id.trim();
    const name = formData.name.trim();

    if (!id) { toast.error('User ID is required'); return; }
    if (!name) { toast.error('Name is required'); return; }
    if (!editUserId && !formData.password.trim()) { toast.error('Password is required'); return; }

    const duplicate = users.some(u => u.id === id && u.id !== editUserId);
    if (duplicate) { toast.error('This User ID is already taken'); return; }

    if (editUserId) {
      const wasLastAdmin = adminCount === 1 && users.find(u => u.id === editUserId)?.role === 'ADMIN';
      if (wasLastAdmin && formData.role !== 'ADMIN') {
        toast.error('At least one Administrator must remain');
        return;
      }
    }

    setLoading(true);
    const payload = { id, name, role: formData.role };
    if (formData.password.trim()) payload.password = formData.password.trim();

    upsertUser(payload);
    setLoading(false);
    setShowFormModal(false);
    refresh();
    toast.success(editUserId ? 'User updated' : 'User added');
  };

  const requestDelete = (u) => {
    if (u.id === currentUser?.id) {
      toast.error('You cannot delete the account you are logged in as');
      return;
    }
    if (u.role === 'ADMIN' && adminCount <= 1) {
      toast.error('At least one Administrator must remain');
      return;
    }
    setDeleteConfirm({ isOpen: true, targetUser: u });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.targetUser) return;
    deleteUser(deleteConfirm.targetUser.id);
    refresh();
    toast.success('User removed');
  };

  const tableHeaders = ["Action", "User ID", "Name", "Role"];

  const renderRow = (u) => (
    <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => openEditForm(u)}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-indigo-100 transition-colors"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => requestDelete(u)}
            className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide hover:bg-red-100 transition-colors"
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-[13px] text-indigo-600 font-bold whitespace-nowrap">{u.id}</td>
      <td className="px-4 py-3 text-center text-[13px] text-gray-900 font-medium whitespace-nowrap">{u.name}</td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${
          u.role === 'ADMIN'
            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>
          {u.role === 'ADMIN' ? <Shield size={11} /> : <UserIcon size={11} />}
          {u.role === 'ADMIN' ? 'Administrator' : 'Employee'}
        </span>
      </td>
    </tr>
  );

  const renderCard = (u) => (
    <div key={u.id} className="bg-white rounded-lg border border-indigo-50 shadow-sm p-3 space-y-2">
      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
        <div>
          <span className="text-[9px] text-indigo-500 uppercase tracking-widest leading-none block mb-1">{u.id}</span>
          <h4 className="text-sm text-gray-900 leading-tight">{u.name}</h4>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${
          u.role === 'ADMIN'
            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>
          {u.role === 'ADMIN' ? <Shield size={10} /> : <UserIcon size={10} />}
          {u.role === 'ADMIN' ? 'Admin' : 'Employee'}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => openEditForm(u)}
          className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={() => requestDelete(u)}
          className="flex-1 bg-red-50 text-red-600 border border-red-200 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-3 md:space-y-6 flex flex-col h-full min-h-0">
      {/* Header + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 px-2 sm:px-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 px-3 h-[34px] rounded-lg text-xs md:text-sm font-semibold bg-indigo-600 border border-indigo-600 text-white shadow-sm">
            <Users size={14} /> Users ({users.length})
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <div className="flex-1 min-w-[160px] relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-sky-500 text-xs sm:text-sm h-[34px]"
            />
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-4 h-[34px] rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus size={16} /> Add User
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
          minWidth="600px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredUsers.length}
        />
      </div>

      {/* Add/Edit User Modal */}
      <ModalForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editUserId ? `Edit User — ${editUserId}` : 'Add User'}
        onSubmit={handleSubmit}
        submitText={loading ? 'Saving...' : 'Save'}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">User ID *</label>
            <div className="relative">
              <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value.trim())}
                placeholder="Enter login ID"
                disabled={!!editUserId}
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px] disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Name *</label>
            <div className="relative">
              <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
                className="w-full border border-gray-300 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Password {editUserId ? '(leave blank to keep unchanged)' : '*'}
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={editUserId ? 'Enter new password' : 'Enter password'}
                className="w-full border border-gray-300 rounded pl-8 pr-9 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[11px] md:text-[13px] h-[30px] md:h-[34px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('role', 'ADMIN')}
                className={`flex items-center justify-center gap-1.5 h-[30px] md:h-[34px] rounded border text-[11px] md:text-[13px] font-semibold uppercase tracking-tight transition-colors ${
                  formData.role === 'ADMIN'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Shield size={14} /> Administrator
              </button>
              <button
                type="button"
                onClick={() => handleChange('role', 'USER')}
                className={`flex items-center justify-center gap-1.5 h-[30px] md:h-[34px] rounded border text-[11px] md:text-[13px] font-semibold uppercase tracking-tight transition-colors ${
                  formData.role === 'USER'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <UserIcon size={14} /> Employee
              </button>
            </div>
          </div>
        </div>
      </ModalForm>

      {/* Delete Confirmation */}
      <ModalAlert
        isOpen={deleteConfirm.isOpen}
        type="confirm"
        title="Remove this user?"
        message={deleteConfirm.targetUser ? `"${deleteConfirm.targetUser.name}" (${deleteConfirm.targetUser.id}) will no longer be able to log in.` : ''}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, targetUser: null })}
      />
    </div>
  );
}
