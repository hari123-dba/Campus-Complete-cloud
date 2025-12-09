import React from 'react';
import { getDataForUser } from '../services/dataService';
import { User, CompetitionStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { Calendar, Users, ArrowRight } from 'lucide-react';

export const Competitions: React.FC<{ user: User }> = ({ user }) => {
  const { competitions } = getDataForUser(user.id, user.role);

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Competitions</h1>
            <p className="text-slate-500">Discover and manage academic challenges</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {competitions.map((comp) => (
           <div key={comp.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group hover:shadow-md transition-shadow">
             <div className="h-32 bg-slate-200 relative">
               <img src={comp.bannerUrl} alt={comp.title} className="w-full h-full object-cover" />
               <div className="absolute top-3 right-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${STATUS_COLORS[comp.status]}`}>
                   {comp.status}
                 </span>
               </div>
             </div>
             <div className="p-5">
               <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{comp.title}</h3>
               <p className="text-sm text-slate-500 line-clamp-2 mb-4">{comp.description}</p>
               
               <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-1.5">
                   <Calendar size={14} />
                   <span>{comp.date}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Users size={14} />
                   <span>{comp.participants} Joined</span>
                 </div>
               </div>
               
               <button className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                 View Details
                 <ArrowRight size={14} />
               </button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};