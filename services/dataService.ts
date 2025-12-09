
import { supabase } from '../lib/supabase';
import { Competition, CompetitionStatus, Project, ProjectPhase, Announcement, UserRole, Team, User, College, UserStatus } from '../types';

// --- MOCK SEED DATA (For Demo/Offline Mode) ---
const SEED_COLLEGES: College[] = [
  { id: 'col_1', name: 'Campus Complete Demo Univ', emailId: 'campus.edu', status: 'Active' },
  { id: 'col_2', name: 'Springfield Institute of Tech', emailId: 'springfield.edu', status: 'Active' },
  { id: 'col_3', name: 'Gotham City University', emailId: 'gcu.edu', status: 'Active' }
];

const SEED_USERS: User[] = [
  { 
    id: 'u_admin', firstName: 'System', lastName: 'Admin', name: 'System Admin', 
    email: 'admin@campus.edu', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    collegeId: 'col_1', status: 'Active', uniqueId: 'ADM001', phoneNumber: '555-0100' 
  },
  { 
    id: 'u_princ', firstName: 'Principal', lastName: 'Skinner', name: 'Principal Skinner', 
    email: 'principal@campus.edu', role: UserRole.PRINCIPAL, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Skinner', 
    collegeId: 'col_1', status: 'Active', uniqueId: 'PRN001', phoneNumber: '555-0101', academicBackground: 'PhD in Education' 
  },
  { 
    id: 'u_hod', firstName: 'HOD', lastName: 'Smith', name: 'HOD Smith', 
    email: 'hod@campus.edu', role: UserRole.HOD, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Smith', 
    collegeId: 'col_1', status: 'Active', uniqueId: 'HOD001', phoneNumber: '555-0102', department: 'Computer Science & Engineering', academicBackground: 'M.Tech CSE'
  },
  { 
    id: 'u_lec', firstName: 'Lecturer', lastName: 'Doe', name: 'Lecturer Doe', 
    email: 'lecturer@campus.edu', role: UserRole.LECTURER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doe', 
    collegeId: 'col_1', status: 'Active', uniqueId: 'LEC001', phoneNumber: '555-0103', department: 'Computer Science & Engineering', academicBackground: 'B.Tech CSE'
  },
  { 
    id: 'u_stu', firstName: 'Student', lastName: 'User', name: 'Student User', 
    email: 'student@campus.edu', role: UserRole.STUDENT, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student', 
    collegeId: 'col_1', status: 'Active', uniqueId: 'STU001', phoneNumber: '555-0104', department: 'Computer Science & Engineering', academicYear: '4th Year', section: 'A'
  }
];

const SEED_COMPETITIONS: Competition[] = [
  {
    id: 'c1', title: 'Annual Hackathon 2024', description: 'Build innovative solutions for campus problems.',
    status: CompetitionStatus.ONGOING, date: 'Oct 15 - Oct 17', participants: 120,
    bannerUrl: 'https://picsum.photos/seed/hackathon/800/300'
  },
  {
    id: 'c2', title: 'Robotics Championship', description: 'Design and battle autonomous robots.',
    status: CompetitionStatus.UPCOMING, date: 'Nov 05, 2024', participants: 45,
    bannerUrl: 'https://picsum.photos/seed/robot/800/300'
  }
];

const SEED_PROJECTS: Project[] = [
  {
    id: 'p1', title: 'Smart Campus Nav', description: 'AR based navigation system for university campus.',
    teamName: 'Wayfinders', studentId: 'u_stu', competitionId: 'c1',
    phase: ProjectPhase.DEVELOPMENT, score: 85, lastUpdated: '2 hours ago'
  },
  {
    id: 'p2', title: 'Library AI Bot', description: 'Automated book tracking and suggestion system.',
    teamName: 'BookWorms', studentId: 'u_stu', competitionId: 'c1',
    phase: ProjectPhase.DESIGN, score: 92, lastUpdated: '1 day ago'
  }
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Hackathon Registration Closing', content: 'Final call for team registrations.', targetRole: 'All', date: 'Oct 10' },
  { id: 'a2', title: 'Faculty Meeting', content: 'Discussing mid-term evaluations.', targetRole: UserRole.LECTURER, date: 'Oct 12' }
];

// --- IN-MEMORY CACHE ---
let _users: User[] = [];
let _colleges: College[] = [];
let _competitions: Competition[] = [];
let _projects: Project[] = [];
let _announcements: Announcement[] = [];
let _teams: Team[] = [];

// --- HELPERS ---
const saveToLocal = (key: string, data: any) => {
  localStorage.setItem(`cc_${key}`, JSON.stringify(data));
};

const mapProfileToUser = (p: any): User => ({
  id: p.id,
  firstName: p.first_name,
  lastName: p.last_name,
  name: `${p.first_name} ${p.last_name}`,
  email: p.email,
  role: p.role as UserRole,
  avatar: p.avatar,
  collegeId: p.college_id,
  status: p.status as UserStatus,
  uniqueId: p.unique_id,
  phoneNumber: p.phone_number,
  department: p.department,
  academicBackground: p.academic_background,
  academicYear: p.academic_year,
  section: p.section
});

const mapUserToProfile = (u: Partial<User>) => ({
  id: u.id,
  first_name: u.firstName,
  last_name: u.lastName,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  college_id: u.collegeId,
  status: u.status,
  unique_id: u.uniqueId,
  phone_number: u.phoneNumber,
  department: u.department,
  academic_background: u.academicBackground,
  academic_year: u.academicYear,
  section: u.section
});

// --- INITIALIZATION ---

export const initializeDatabase = async () => {
  console.log('Initializing Data Service...');
  
  // 1. Try Supabase First
  let usedSupabase = false;
  
  if (supabase) {
    try {
      const { data: colleges, error: errCol } = await supabase.from('colleges').select('*');
      if (!errCol && colleges) {
        _colleges = colleges.map(c => ({ id: c.id, name: c.name, emailId: c.email_id, status: c.status }));
        usedSupabase = true;
      }
      
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) _users = profiles.map(mapProfileToUser);

      const { data: comps } = await supabase.from('competitions').select('*');
      if (comps) _competitions = comps.map(c => ({
         id: c.id, title: c.title, description: c.description, status: c.status as CompetitionStatus, date: c.date, participants: c.participants, bannerUrl: c.banner_url 
      }));

      const { data: projs } = await supabase.from('projects').select('*');
      if (projs) _projects = projs.map(p => ({
         id: p.id, title: p.title, description: p.description, teamName: p.team_name, studentId: p.student_id, competitionId: p.competition_id, phase: p.phase as ProjectPhase, score: p.score, lastUpdated: p.last_updated
      }));
      
      // Load other entities similarly...
      
    } catch (err) {
      console.warn('Supabase connection failed, falling back to LocalStorage', err);
    }
  }

  // 2. Fallback to LocalStorage / Seed if Supabase didn't work or return data
  if (!usedSupabase) {
    console.log('Using LocalStorage/Seed Data');
    
    const localColleges = localStorage.getItem('cc_colleges');
    
    // Check if data exists AND is not an empty array (which would mean it was deleted/corrupted)
    if (localColleges && JSON.parse(localColleges).length > 0) {
      _colleges = JSON.parse(localColleges);
      _users = JSON.parse(localStorage.getItem('cc_users') || '[]');
      _competitions = JSON.parse(localStorage.getItem('cc_competitions') || '[]');
      _projects = JSON.parse(localStorage.getItem('cc_projects') || '[]');
      _announcements = JSON.parse(localStorage.getItem('cc_announcements') || '[]');
      _teams = JSON.parse(localStorage.getItem('cc_teams') || '[]');
    } else {
      // Auto-Recover / Seed Data
      console.log('Data Missing or Empty. Re-seeding Defaults.');
      _colleges = SEED_COLLEGES;
      _users = SEED_USERS;
      _competitions = SEED_COMPETITIONS;
      _projects = SEED_PROJECTS;
      _announcements = SEED_ANNOUNCEMENTS;
      
      saveToLocal('colleges', _colleges);
      saveToLocal('users', _users);
      saveToLocal('competitions', _competitions);
      saveToLocal('projects', _projects);
      saveToLocal('announcements', _announcements);
    }
  }
};


// --- DATA ACCESSORS ---

export const getColleges = () => [..._colleges];
export const getAllUsers = () => [..._users];

export const getDataForUser = (userId: string, role: UserRole) => {
  return {
    competitions: [..._competitions],
    projects: role === UserRole.STUDENT 
      ? _projects.filter(p => p.studentId === userId) 
      : [..._projects],
    announcements: _announcements.filter(a => a.targetRole === 'All' || a.targetRole === role)
  };
};

export const getUserTeams = (userId: string): Team[] => {
  return _teams.filter(t => t.members.some(m => m.userId === userId));
};

export const getPendingUsers = (approver: User): User[] => {
  if (approver.role === UserRole.ADMIN) {
    return _users.filter(u => u.role === UserRole.PRINCIPAL && u.status === 'Pending');
  }
  if (approver.role === UserRole.PRINCIPAL) {
    return _users.filter(u => 
      u.role === UserRole.HOD && u.collegeId === approver.collegeId && u.status === 'Pending'
    );
  }
  if (approver.role === UserRole.HOD) {
    return _users.filter(u => 
      u.role === UserRole.LECTURER && u.collegeId === approver.collegeId && u.department === approver.department && u.status === 'Pending'
    );
  }
  if (approver.role === UserRole.LECTURER) {
    return _users.filter(u => 
      u.role === UserRole.STUDENT && u.collegeId === approver.collegeId && u.department === approver.department && u.status === 'Pending'
    );
  }
  return [];
};

// --- MUTATIONS ---

export const createTeam = async (name: string, user: User): Promise<Team> => {
  const teamId = `t${Date.now()}`;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Update Cache
  const newTeam: Team = {
    id: teamId,
    name,
    code,
    members: [{ userId: user.id, name: user.name, role: 'Leader', avatar: user.avatar }],
    projectIds: []
  };
  _teams = [..._teams, newTeam];
  saveToLocal('teams', _teams);

  // Try DB
  if (supabase) {
    await supabase.from('teams').insert({ id: teamId, name, code, project_ids: [] });
    await supabase.from('team_members').insert({ team_id: teamId, user_id: user.id, role: 'Leader', name: user.name, avatar: user.avatar });
  }
  
  return newTeam;
};

export const joinTeam = async (code: string, user: User): Promise<Team> => {
  const team = _teams.find(t => t.code === code.trim());
  if (!team) throw new Error('Invalid invite code.');
  
  if (team.members.some(m => m.userId === user.id)) {
    throw new Error('You are already a member of this team.');
  }

  const newMember = { userId: user.id, name: user.name, role: 'Member' as const, avatar: user.avatar };
  
  const teamIndex = _teams.findIndex(t => t.id === team.id);
  if (teamIndex !== -1) {
    _teams[teamIndex].members.push(newMember);
    saveToLocal('teams', _teams);
  }

  if (supabase) {
    await supabase.from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'Member', name: user.name, avatar: user.avatar });
  }

  return _teams[teamIndex];
};


export const registerUser = async (userData: Partial<User>): Promise<User> => {
  if (!userData.email || !userData.collegeId || !userData.role) throw new Error("Missing required fields");

  const existing = _users.find(u => u.email.toLowerCase() === userData.email?.toLowerCase() && u.collegeId === userData.collegeId);
  if (existing) throw new Error(`Email ${userData.email} is already registered in this college.`);

  const newId = `u${Date.now()}`;
  const newUser = {
    ...userData,
    id: newId,
    name: `${userData.firstName} ${userData.lastName}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}`,
    status: userData.status || 'Pending'
  } as User;

  _users = [..._users, newUser];
  saveToLocal('users', _users);

  if (supabase) {
    const dbProfile = mapUserToProfile(newUser);
    await supabase.from('profiles').insert(dbProfile);
  }
  return newUser;
};


export const approveUser = async (userId: string): Promise<void> => {
  const index = _users.findIndex(u => u.id === userId);
  if (index !== -1) {
    _users[index] = { ..._users[index], status: 'Active' };
    saveToLocal('users', _users);
  }
  
  if (supabase) {
    await supabase.from('profiles').update({ status: 'Active' }).eq('id', userId);
  }
};

export const rejectUser = async (userId: string): Promise<void> => {
  const index = _users.findIndex(u => u.id === userId);
  if (index !== -1) {
    _users[index] = { ..._users[index], status: 'Rejected' };
    saveToLocal('users', _users);
  }

  if (supabase) {
    await supabase.from('profiles').update({ status: 'Rejected' }).eq('id', userId);
  }
};

export const addCollege = async (name: string, emailId: string): Promise<College> => {
  const newCollege = {
    id: `col_${Date.now()}`,
    name,
    emailId,
    status: 'Active' as const
  };

  _colleges = [..._colleges, newCollege];
  saveToLocal('colleges', _colleges);

  if (supabase) {
    await supabase.from('colleges').insert({ id: newCollege.id, name: newCollege.name, email_id: newCollege.emailId, status: newCollege.status });
  }
  return newCollege;
};

export const updateCollegeStatus = async (id: string, status: 'Active' | 'Suspended'): Promise<void> => {
  const index = _colleges.findIndex(c => c.id === id);
  if (index !== -1) {
    _colleges[index] = { ..._colleges[index], status };
    saveToLocal('colleges', _colleges);
  }

  if (supabase) {
    await supabase.from('colleges').update({ status }).eq('id', id);
  }
};

export const removeCollege = async (id: string): Promise<void> => {
  _colleges = _colleges.filter(c => c.id !== id);
  saveToLocal('colleges', _colleges);
  
  if (supabase) {
    await supabase.from('colleges').delete().eq('id', id);
  }
};

export const resetDatabase = () => {
  localStorage.clear();
  window.location.reload();
};
