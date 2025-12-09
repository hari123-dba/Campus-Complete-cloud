import React from 'react';
import { UserRole } from '../types';
import { ROLE_CONFIG } from '../constants';
import { ChevronRight } from 'lucide-react';

interface RoleCardProps {
  role: UserRole;
  onClick: (role: UserRole, email: string) => void;
  isLoading?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onClick, isLoading }) => {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <button
      onClick={() => onClick(role, config.demoEmail)}
      disabled={isLoading}
      className="group relative w-full flex items-center p-4 mb-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-left"
    >
      <div className={`w-12 h-12 rounded-xl ${config.color} bg-opacity-10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800">{role}</h3>
        <p className="text-xs text-slate-500 line-clamp-1">{config.description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      
      {/* Visual indicator for demo mode helper */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};