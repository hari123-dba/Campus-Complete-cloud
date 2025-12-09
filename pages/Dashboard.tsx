import React, { useState, useEffect } from 'react';
import { User, UserRole, ProjectPhase, College } from '../types';
import { getDataForUser, getPendingUsers, approveUser, rejectUser, registerUser, addCollege, getColleges, updateCollegeStatus, removeCollege } from '../services/dataService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Clock, TrendingUp, AlertCircle, CheckCircle2, UserCheck, XCircle, Check, UserPlus, X, Loader2, School, ChevronRight, Ban, Trash2, Power } from 'lucide-react';
import { DEPARTMENTS } from '../constants';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { competitions, projects, announcements } = getDataForUser(user.id, user.role);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [processedIds, setProcessedIds] = useState<string[]>([]);
  
  // Admin: Add User / College States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ 
    firstName: '', lastName: '', email: '', uniqueId: '', phoneNumber: '', role: UserRole.STUDENT, department: '' 
  });
  const [newCollegeForm, setNewCollegeForm] = useState({ name: '', emailId: '' });
  
  // Admin: College Directory State
  const [collegeList, setCollegeList] = useState<College[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalMsg, setModalMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Initial Fetch for College List if Admin
  useEffect(() => {
    if (user.role === UserRole.ADMIN) {
      setCollegeList(getColleges());
    }
  }, [user.role]);

  // Fetch pending users based on Role Hierarchy
  useEffect(() => {
    // All roles (except maybe Student) might have approval responsibilities now
    if (user.role !== UserRole.STUDENT) {
      const updatePending = () => {
        const pending = getPendingUsers(user);
        // Filter out processed IDs locally to update UI instantly before re-fetch or if fetch is static
        setPendingUsers(pending.filter(p => !processedIds.includes(p.id)));
      };
      updatePending();
      // Simple poll for demo effect
      const interval = setInterval(updatePending, 5000);
      return () => clearInterval(interval);
    }
  }, [user, processedIds]);

  const handleApprove = async (id: string) => {
    await approveUser(id);
    setProcessedIds([...processedIds, id]);
  };

  const handleReject = async (id: string) => {
    await rejectUser(id);
    setProcessedIds([...processedIds, id]);
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setModalMsg(null);
    try {
      await addCollege(newCollegeForm.name, newCollegeForm.emailId);
      setModalMsg({ type: 'success', text: 'College added successfully.' });
      setNewCollegeForm({ name: '', emailId: '' });
      setCollegeList([...getColleges()]); // Refresh list
      setTimeout(() => setShowAddCollegeModal(false), 1500);
    } catch (err: any) {
      setModalMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCollegeStatus = async (college: College) => {
    const newStatus = college.status === 'Active' ? 'Suspended' : 'Active';
    await updateCollegeStatus(college.id, newStatus);
    setCollegeList([...getColleges()]); // Refresh UI
  };

  const handleRemoveCollege = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this college? All associated users may lose access.')) {
      await removeCollege(id);
      setCollegeList([...getColleges()]); // Refresh UI
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setModalMsg(null);
    try {
      // Admin manual add -> Auto Activate
      await registerUser({
        ...newUserForm,
        collegeId: user.collegeId,
        status: 'Active'
      });
      setModalMsg({ type: 'success', text: `Successfully added ${newUserForm.firstName} to the system.` });
      setNewUserForm({ firstName: '', lastName: '', email: '', uniqueId: '', phoneNumber: '', role: UserRole.STUDENT, department: '' });
      setTimeout(() => {
        setShowAddUserModal(false);
        setModalMsg(null);
      }, 2000);
    } catch (err: any) {
      setModalMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Stats Calculation
  const activeCompetitions = competitions.filter(c => c.status === 'Ongoing').length;
  const pendingProjects = projects.filter(p => p.phase !== ProjectPhase.IMPLEMENTATION).length;
  
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.firstName}!</h1>
          <p className="text-slate-500">Here's what's happening in your campus today.</p>
        </div>
        
        {user.role === UserRole.ADMIN && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddCollegeModal(true)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <School size={18} />
              <span className="hidden md:inline">Add College</span>
            </button>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
            >
              <UserPlus size={18} />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Unified Pending Approvals Alert (For all Approver Roles) */}
      {pendingUsers.length > 0 && (
        <div className="bg-white border border-yellow-200 bg-yellow-50/50 rounded-2xl p-6 shadow-sm animate-fade-in">
           <div className="flex items-center gap-2 mb-4">
             <div className="relative">
                <UserCheck className="text-yellow-600" size={24} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-800">Pending Approvals</h3>
               <p className="text-xs text-slate-500">
                 {user.role === UserRole.ADMIN && "Review Principal registrations."}
                 {user.role === UserRole.PRINCIPAL && "Review HOD registrations for your college."}
                 {user.role === UserRole.HOD && "Review Lecturer registrations for your department."}
                 {user.role === UserRole.LECTURER && "Review Student registrations."}
               </p>
             </div>
             <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
             {pendingUsers.map(u => (
               <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <img src={u.avatar} alt="" className="w-10 h-10 rounded-full" />
                     <div>
                       <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                       <p className="text-xs text-slate-500 font-medium">{u.role}</p>
                     </div>
                   </div>
                   <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">{u.uniqueId}</span>
                 </div>
                 
                 <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                   {(u.department) && <div className="mb-1"><strong>Dept:</strong> {u.department}</div>}
                   {u.academicBackground && <div className="italic">"{u.academicBackground}"</div>}
                   {u.role === UserRole.STUDENT && <div>{u.academicYear}, Section {u.section}</div>}
                 </div>

                 <div className="flex gap-2 mt-auto pt-2">
                   <button 
                     onClick={() => handleReject(u.id)}
                     className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                   >
                     Reject
                   </button>
                   <button 
                     onClick={() => handleApprove(u.id)}
                     className="flex-1 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold transition-colors"
                   >
                     Approve
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* College Directory (Admin Only) */}
      {user.role === UserRole.ADMIN && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <School size={20} className="text-blue-600" />
                College Directory
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {collegeList.length} Institutions
              </span>
           </div>
           <div className="divide-y divide-slate-100">
              {collegeList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No colleges registered yet.</div>
              ) : (
                collegeList.map(college => (
                  <div key={college.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                     <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold ${college.status === 'Suspended' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {college.name}
                          </h4>
                          {college.status === 'Suspended' && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Suspended</span>
                          )}
                          {college.status === 'Active' && (
                             <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Active</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">@{college.emailId}</span>
                        </p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleCollegeStatus(college)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            college.status === 'Active' 
                              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {college.status === 'Active' ? <Ban size={14} /> : <Power size={14} />}
                          {college.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button 
                          onClick={() => handleRemoveCollege(college.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Competitions" value={activeCompetitions} icon={TrendingUp} color="bg-blue-600" />
        <StatCard title="My Projects" value={projects.length} icon={Clock} color="bg-orange-500" />
        <StatCard title="Pending Review" value={pendingProjects} icon={AlertCircle} color="bg-yellow-500" />
        <StatCard title="Completed" value={projects.length - pendingProjects} icon={CheckCircle2} color="bg-green-500" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Project Progress Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projects}>
                  <XAxis dataKey="title" tick={{fontSize: 12}} interval={0} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {projects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#22c55e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Recent Projects</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
             </div>
             <div className="divide-y divide-slate-100">
               {projects.map(project => (
                 <div key={project.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                   <div className="flex items-start gap-3">
                     <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                       {project.title.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                       <h4 className="font-semibold text-slate-800">{project.title}</h4>
                       <p className="text-xs text-slate-500">{project.teamName}</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       project.phase === 'Implementation' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                     }`}>
                       {project.phase}
                     </span>
                     <span className="text-xs text-slate-400">{project.lastUpdated}</span>
                   </div>
                 </div>
               ))}
               {projects.length === 0 && (
                 <div className="p-8 text-center text-slate-400">No projects found.</div>
               )}
             </div>
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Announcements</h3>
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div key={announcement.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {announcement.targetRole === 'All' ? 'Everyone' : announcement.targetRole}
                    </span>
                    <span className="text-xs text-slate-400">{announcement.date}</span>
                  </div>
                  <h4 className="font-medium text-slate-800 text-sm">{announcement.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{announcement.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Institution Member</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              {modalMsg && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${modalMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                   <AlertCircle size={16} />
                   <span>{modalMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" 
                           value={newUserForm.firstName} onChange={(e) => setNewUserForm({...newUserForm, firstName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input type="text" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" 
                           value={newUserForm.lastName} onChange={(e) => setNewUserForm({...newUserForm, lastName: e.target.value})} />
                 </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unique ID</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none" 
                         value={newUserForm.uniqueId} onChange={(e) => setNewUserForm({...newUserForm, uniqueId: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                   <select 
                     value={newUserForm.role}
                     onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value as UserRole})}
                     className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                   >
                     {Object.values(UserRole).filter(r => r !== UserRole.ADMIN).map(role => (
                       <option key={role} value={role}>{role}</option>
                     ))}
                   </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add College Modal */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New College</h3>
              <button onClick={() => setShowAddCollegeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddCollege}>
              {modalMsg && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${modalMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                   <AlertCircle size={16} />
                   <span>{modalMsg.text}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">College Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCollegeForm.name}
                  onChange={(e) => setNewCollegeForm({...newCollegeForm, name: e.target.value})}
                  placeholder="e.g. Gotham University"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">College Email Domain / ID</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newCollegeForm.emailId}
                  onChange={(e) => setNewCollegeForm({...newCollegeForm, emailId: e.target.value})}
                  placeholder="e.g. info@gotham.edu"
                />
                <p className="text-xs text-slate-400 mt-1">Used to identify valid email addresses for this college.</p>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Add College'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};