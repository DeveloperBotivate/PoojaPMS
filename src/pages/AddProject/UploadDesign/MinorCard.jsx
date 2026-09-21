import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Calendar, ChevronRight, Trash2 } from 'lucide-react';

export default function MinorCard({ minor, onDelete }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/view-design/${encodeURIComponent(minor.id)}`)}
      className="bg-white rounded-xl border border-rose-100 shadow-sm p-4 hover:shadow-md transition cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-rose-50 p-2 rounded-lg text-rose-600 flex-shrink-0">
            <FileUp size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors truncate">
              {minor.minorName}
            </h3>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Calendar size={10} />
              {new Date(minor.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(minor); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete minor"
          >
            <Trash2 size={16} />
          </button>
          <ChevronRight size={18} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
