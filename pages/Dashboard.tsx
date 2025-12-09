import React, { useState, useEffect } from 'react';
import { User, UserRole, ProjectPhase, College } from '../types';
import { getDataForUser, getPendingUsers, approveUser, rejectUser, registerUser, addCollege, getColleges, updateCollegeStatus, removeCollege, getAllUsers } from '../services/dataService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Clock, TrendingUp, AlertCircle, CheckCircle2, UserCheck, XCircle, 
  School, UserPlus, X, Loader2, Shield, Users, Trophy, Award,
  FileText, Activity, Settings, BarChart2, UserCog, Ban, Power, Trash2 
} from 'lucide-react';
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
  const [allSystemUsers, setAllSystemUsers] = useState<User[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalMsg, setModalMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Initial Fetch for College List & Users if Admin
  useEffect(() => {
    if (user.role === UserRole.ADMIN) {
      setCollegeList(getColleges());
      setAllSystemUsers(getAllUsers());
    }
  }, [user.role, pendingUsers]); // Update when pending users change (e.g. approved)

  // Fetch pending users based on Role Hierarchy
  useEffect(() => {
    // All roles (except Student) have approval responsibilities
    if (user.role !== UserRole.STUDENT) {
      const updatePending = () => {
        const pending = getPendingUsers(user);
        // Filter out processed IDs locally to update UI instantly before re-fetch or if fetch is static
        setPendingUsers(pending.filter(p => !processedIds.includes(p.id)));
      };
      updatePending();
      // Poll every 5 seconds to keep dashboard synced
      const interval = setInterval(updatePending, 5000);
      return () => clearInterval(interval);
    }
  }, [user, processedIds]);

  const handleApprove = async (id: string) => {
    await approveUser(id);
    setProcessedIds(prev => [...prev, id]);
    // Refresh admin data if needed
    if (user.role === UserRole.ADMIN) setAllSystemUsers(getAllUsers());
  };

  const handleReject = async (id: string) => {
    if(window.confirm("Are you sure you want to reject this user?")) {
      await rejectUser(id);
      setProcessedIds(prev => [...prev, id]);
       if (user.role === UserRole.ADMIN) setAllSystemUsers(getAllUsers());
    }
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
        setAllSystemUsers(getAllUsers());
      }, 2000);
    } catch (err: any) {
      setModalMsg({ type: 'error', text: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Stats Calculation for non-admin
  const activeCompetitions = competitions.filter(c => c.status === 'Ongoing').length;
  const pendingProjects = projects.filter(p => p.phase !== ProjectPhase.IMPLEMENTATION).length;
  
  const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      {trend && (
         <div className="flex items-center self-end mb-1">
             <span className="text-green-500 text-xs font-bold">{trend}</span>
         </div>
      )}
      {trendLabel && (
        <span className="text-green-500 text-sm font-medium self-end">{trendLabel}</span>
      )}
    </div>
  );

  // --- RENDER ADMIN DASHBOARD ---
  if (user.role === UserRole.ADMIN) {
    // Admin Specific Calculations
    const totalUsers = allSystemUsers.length;
    const studentCount = allSystemUsers.filter(u => u.role === UserRole.STUDENT).length;
    const lecturerCount = allSystemUsers.filter(u => u.role === UserRole.LECTURER).length;
    const hodCount = allSystemUsers.filter(u => u.role === UserRole.HOD).length;
    const principalCount = allSystemUsers.filter(u => u.role === UserRole.PRINCIPAL).length;

    const getPercent = (count: number) => totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

    return (
      <div className="space-y-6 animate-fade-in relative pb-20">
        {/* Red Header Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-lg shadow-red-200">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield size={32} />
             </div>
             <div>
               <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
               <p className="text-red-100 opacity-90 mt-1">Complete system control and management</p>
             </div>
          </div>
        </div>

        {/* Pending Approvals Alert (Preserved functionality) */}
        {pendingUsers.length > 0 && (
          <div className="bg-white border border-yellow-200 bg-yellow-50/50 rounded-2xl p-6 shadow-sm animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
               <div className="relative">
                  <UserCheck className="text-yellow-600" size={24} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
               </div>
               <div>
                 <h3 className="font-bold text-lg text-slate-800">Pending Approvals</h3>
                 <p className="text-xs text-slate-500">Review Principal registrations.</p>
               </div>
               <span className="ml-auto bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {pendingUsers.map(u => (
                 <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100" />
                     <div>
                       <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                       <p className="text-xs text-slate-500">{u.role} • {u.email}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => handleReject(u.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X size={16} /></button>
                     <button onClick={() => handleApprove(u.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle2 size={16} /></button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Total Users" 
             value={totalUsers.toLocaleString()} 
             icon={Users} 
             color="bg-blue-600"
             trend="+12%"
           />
           <StatCard 
             title="Active Competitions" 
             value={activeCompetitions} 
             icon={Award} 
             color="bg-purple-600"
             trend="+3"
           />
           <StatCard 
             title="Total Projects" 
             value={projects.length} 
             icon={FileText} 
             color="bg-green-600"
             trend="+28%"
           />
           <StatCard 
             title="System Health" 
             value="98%" 
             icon={Activity} 
             color="bg-orange-500"
             trendLabel="Good"
           />
        </div>

        {/* Admin Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
           <h3 className="font-medium text-slate-800 mb-4">Admin Actions</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setShowAddUserModal(true)} className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors">
                 <UserCog size={20} /> Manage Users
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-xl font-semibold hover:bg-purple-100 transition-colors">
                 <Trophy size={20} /> Competitions
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-colors">
                 <BarChart2 size={20} /> Analytics
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-xl font-semibold hover:bg-orange-100 transition-colors">
                 <Settings size={20} /> Settings
              </button>
           </div>
        </div>

        {/* Users by Role & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Users by Role */}
           <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-medium text-slate-800 mb-6">Users by Role</h3>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-slate-700">Students</span>
                       <span className="text-slate-500">{studentCount} ({getPercent(studentCount)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full" style={{width: `${getPercent(studentCount)}%`}}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-slate-700">Lecturers</span>
                       <span className="text-slate-500">{lecturerCount} ({getPercent(lecturerCount)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 rounded-full" style={{width: `${getPercent(lecturerCount)}%`}}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-slate-700">HODs</span>
                       <span className="text-slate-500">{hodCount} ({getPercent(hodCount)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-purple-500 rounded-full" style={{width: `${getPercent(hodCount)}%`}}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-slate-700">Principals</span>
                       <span className="text-slate-500">{principalCount} ({getPercent(principalCount)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 rounded-full" style={{width: `${getPercent(principalCount)}%`}}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Recent System Activities */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-medium text-slate-800 mb-6">Recent System Activities</h3>
              <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                 {/* Mock Activity Data based on Image */}
                 <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></span>
                    <p className="text-sm font-medium text-slate-800">New user registered</p>
                    <p className="text-xs text-slate-500 mt-0.5">Emma Watson • 5 min ago</p>
                 </div>
                 <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white"></span>
                    <p className="text-sm font-medium text-slate-800">Competition created</p>
                    <p className="text-xs text-slate-500 mt-0.5">Admin • 15 min ago</p>
                 </div>
                 <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                    <p className="text-sm font-medium text-slate-800">Project submitted</p>
                    <p className="text-xs text-slate-500 mt-0.5">John Doe • 1 hour ago</p>
                 </div>
                  <div className="relative">
                    <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white"></span>
                    <p className="text-sm font-medium text-slate-800">System backup completed</p>
                    <p className="text-xs text-slate-500 mt-0.5">System • 3 hours ago</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Modals remain same as original */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Add User</h3>
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
                {/* Form fields same as before... simplified for this specific response context but included functionality */}
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

                <button type="submit" disabled={isProcessing} className="w-full py-3 bg-slate-900 text-white rounded-xl">
                  {isProcessing ? <Loader2 className="animate-spin inline" /> : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER STANDARD DASHBOARD (Principal, HOD, Lecturer, Student) ---
  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.firstName}!</h1>
          <p className="text-slate-500">Here's what's happening in your campus today.</p>
        </div>
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
                     <img src={u.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100" />
                     <div>
                       <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                       <p className="text-xs text-slate-500 font-medium">{u.role}</p>
                     </div>
                   </div>
                   <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">{u.uniqueId}</span>
                 </div>
                 
                 <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                   {(u.department) && <div><strong>Dept:</strong> {u.department}</div>}
                   {u.academicBackground && <div className="italic">"{u.academicBackground}"</div>}
                   {u.role === UserRole.STUDENT && <div>{u.academicYear}, Section {u.section}</div>}
                   <div className="text-[10px] text-slate-400 mt-1">{u.email}</div>
                 </div>

                 <div className="flex gap-2 mt-auto pt-2">
                   <button 
                     onClick={() => handleReject(u.id)}
                     className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                   >
                     <XCircle size={14} /> Reject
                   </button>
                   <button 
                     onClick={() => handleApprove(u.id)}
                     className="flex-1 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                   >
                     <CheckCircle2 size={14} /> Approve
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Competitions</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeCompetitions}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 bg-opacity-10 flex items-center justify-center text-blue-600"><TrendingUp size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">My Projects</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{projects.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500 bg-opacity-10 flex items-center justify-center text-orange-500"><Clock size={24}/></div>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{pendingProjects}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500 bg-opacity-10 flex items-center justify-center text-yellow-500"><AlertCircle size={24}/></div>
        </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{projects.length - pendingProjects}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500 bg-opacity-10 flex items-center justify-center text-green-500"><CheckCircle2 size={24}/></div>
        </div>
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
    </div>
  );
};