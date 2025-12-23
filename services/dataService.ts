import { Competition, CompetitionStatus, Project, ProjectPhase, Announcement, UserRole, Team, User, College, ActivityLog, TeamMember } from '../types';
import { db, storage, auth } from '../lib/firebase';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, setDoc, Timestamp, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// --- SEED DATA CONSTANTS ---
const SEED_COLLEGES: College[] = [
  { 
    id: 'kWE1Ir8wlBnv31BdZyDQ', 
    name: 'Campus Complete Demo Univ', 
    emailId: 'campus.edu', 
    website: 'https://demo.campus.edu', 
    address: '123 Innovation Drive, Tech City',
    contactPhone: '555-0199',
    status: 'Active',
    createdAt: '2023-01-15T00:00:00.000Z',
    logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=100&h=100',
    logoFileName: 'demo-univ.png'
  },
  { 
    id: 'H8IFKjuoSkrUtiDlJEFp', 
    name: 'Main Campus University', 
    emailId: 'univ.edu', 
    website: 'https://univ.edu', 
    address: 'Main St, Academic District',
    contactPhone: '555-0500',
    status: 'Active',
    createdAt: new Date().toISOString(),
    logoUrl: '',
    logoFileName: ''
  }
];

const SEED_USERS: User[] = [
  { 
    id: 'u_admin', firstName: 'System', lastName: 'Admin', name: 'System Admin', 
    email: 'admin@campus.edu', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    status: 'Active', uniqueId: 'ADM001', phoneNumber: '555-0100' 
  },
  { 
    id: 'u_princ', firstName: 'Principal', lastName: 'Skinner', name: 'Principal Skinner', 
    email: 'principal@campus.edu', role: UserRole.PRINCIPAL, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Skinner', 
    collegeId: 'kWE1Ir8wlBnv31BdZyDQ', status: 'Active', uniqueId: 'PRN001', phoneNumber: '555-0101', academicBackground: 'PhD in Education' 
  },
  { 
    id: 'u_hod', firstName: 'HOD', lastName: 'Smith', name: 'HOD Smith', 
    email: 'hod@campus.edu', role: UserRole.HOD, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Smith', 
    collegeId: 'kWE1Ir8wlBnv31BdZyDQ', status: 'Active', uniqueId: 'HOD001', phoneNumber: '555-0102', department: 'Computer Science & Engineering', academicBackground: 'M.Tech CSE'
  },
  { 
    id: 'u_lec', firstName: 'Lecturer', lastName: 'Doe', name: 'Lecturer Doe', 
    email: 'lecturer@campus.edu', role: UserRole.LECTURER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doe', 
    collegeId: 'kWE1Ir8wlBnv31BdZyDQ', status: 'Active', uniqueId: 'LEC001', phoneNumber: '555-0103', department: 'Computer Science & Engineering', academicBackground: 'B.Tech CSE'
  },
  { 
    id: 'u_stu', firstName: 'Student', lastName: 'User', name: 'Student User', 
    email: 'student@campus.edu', role: UserRole.STUDENT, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student', 
    collegeId: 'kWE1Ir8wlBnv31BdZyDQ', status: 'Active', uniqueId: 'STU001', phoneNumber: '555-0104', department: 'Computer Science & Engineering', academicYear: '4th Year', section: 'A'
  }
];

const SEED_COMPETITIONS: Competition[] = [
  {
    id: 'comp_1',
    title: 'National Innovation Hackathon',
    description: 'A 48-hour challenge to build sustainable solutions for urban waste management using IoT and AI.',
    status: CompetitionStatus.ONGOING,
    date: 'Sept 15-17, 2024',
    participants: 124,
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'comp_2',
    title: 'Inter-University Robotics Cup',
    description: 'Annual robotics competition focusing on autonomous navigation and swarm intelligence.',
    status: CompetitionStatus.UPCOMING,
    date: 'Oct 22, 2024',
    participants: 45,
    bannerUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80'
  }
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Welcome to Campus Complete',
    content: 'We are thrilled to launch the new centralized project and competition management platform. Start building your teams today!',
    targetRole: 'All',
    date: new Date().toLocaleDateString()
  },
  {
    id: 'ann_2',
    title: 'Annual Research Grant Cycle Open',
    content: 'Principals and HODs can now submit departmental research proposals for the 2024-25 funding cycle.',
    targetRole: UserRole.PRINCIPAL,
    date: new Date().toLocaleDateString()
  }
];

/**
 * Initializes the database with modular steps.
 */
export const initializeDatabase = async (onProgress?: (step: number, label: string) => void) => {
  try {
    const batch = writeBatch(db);

    // Step 1: Institutions
    if (onProgress) onProgress(1, 'Building Institutional Records');
    for (const col of SEED_COLLEGES) {
      const colRef = doc(db, 'colleges', col.id);
      batch.set(colRef, col);
    }

    // Step 2: Users
    if (onProgress) onProgress(2, 'Provisioning Access Roles');
    for (const user of SEED_USERS) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, user);
    }

    // Step 3: Competitions & Announcements
    if (onProgress) onProgress(3, 'Populating Global Events');
    for (const comp of SEED_COMPETITIONS) {
      const compRef = doc(db, 'competitions', comp.id);
      batch.set(compRef, comp);
    }
    for (const ann of SEED_ANNOUNCEMENTS) {
      const annRef = doc(db, 'announcements', ann.id);
      batch.set(annRef, ann);
    }

    // Step 4: Sample Team & Project for Demo Student
    if (onProgress) onProgress(4, 'Indexing Initial Content');
    const teamId = 'team_sample_1';
    const projId = 'proj_sample_1';
    
    const teamRef = doc(db, 'teams', teamId);
    batch.set(teamRef, {
      id: teamId,
      name: 'Innovation Alchemists',
      code: 'ALCHY1',
      projectIds: [projId],
      members: [{ 
        userId: 'u_stu', 
        name: 'Student User', 
        role: 'Leader', 
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student' 
      }]
    });

    const projRef = doc(db, 'projects', projId);
    batch.set(projRef, {
      id: projId,
      title: 'Smart Solar Tracker',
      description: 'Dual-axis solar tracking system for maximum efficiency in residential panels.',
      teamName: 'Innovation Alchemists',
      studentId: 'u_stu',
      competitionId: 'comp_1',
      phase: ProjectPhase.DEVELOPMENT,
      score: 85,
      lastUpdated: new Date().toISOString()
    });

    await batch.commit();
    if (onProgress) onProgress(5, 'System Ready');
    
    await logActivity(null, 'SYS_INIT', 'Initial database seeding completed successfully', 'success');
  } catch (error: any) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

const mapDoc = <T>(doc: any): T => ({ id: doc.id, ...doc.data() } as T);

export const uploadImage = async (file: File, path: string): Promise<{ url: string }> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url };
};

export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') throw error;
  }
};

export const logActivity = async (actor: User | null, action: string, details: string, type: 'info' | 'success' | 'warning' | 'error' | 'critical' = 'info') => {
  try {
    await addDoc(collection(db, 'logs'), {
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'System',
      action,
      details,
      timestamp: new Date().toISOString(),
      type
    });
  } catch (e) {
    console.error("Failed to log activity", e);
  }
};

export const getColleges = async (): Promise<College[]> => {
  try {
    const collegesRef = collection(db, 'colleges');
    const q = query(collegesRef, where('status', '==', 'Active'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => mapDoc<College>(d));
  } catch (err: any) {
    console.warn("Could not fetch colleges:", err.message);
    return [];
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => mapDoc<User>(d));
};

export const getSystemLogs = async (): Promise<ActivityLog[]> => {
  const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<ActivityLog>(d));
};

export const getDataForUser = async (userId: string, role: UserRole) => {
  try {
    const compSnap = await getDocs(collection(db, 'competitions'));
    const competitions = compSnap.docs.map(d => mapDoc<Competition>(d));

    let announceQuery = role === UserRole.ADMIN 
      ? query(collection(db, 'announcements'))
      : query(collection(db, 'announcements'), where('targetRole', 'in', ['All', role]));
    
    const announceSnap = await getDocs(announceQuery);
    const announcements = announceSnap.docs.map(d => mapDoc<Announcement>(d));

    let projSnap;
    if (role === UserRole.STUDENT) {
      projSnap = await getDocs(query(collection(db, 'projects'), where('studentId', '==', userId)));
    } else {
      projSnap = await getDocs(collection(db, 'projects'));
    }
    const projects = projSnap.docs.map(d => mapDoc<Project>(d));

    return { competitions, projects, announcements };
  } catch (e) {
    return { competitions: [], projects: [], announcements: [] };
  }
};

export const getUserTeams = async (userId: string): Promise<Team[]> => {
  const snap = await getDocs(collection(db, 'teams'));
  const allTeams = snap.docs.map(d => mapDoc<Team>(d));
  return allTeams.filter(t => t.members.some(m => m.userId === userId));
};

export const getPendingUsers = async (approver: User): Promise<User[]> => {
  const q = query(collection(db, 'users'), where('status', '==', 'Pending'), limit(100));
  const snap = await getDocs(q);
  const pending = snap.docs.map(d => mapDoc<User>(d));

  if (approver.role === UserRole.ADMIN) return pending.filter(u => u.role === UserRole.PRINCIPAL);
  if (approver.role === UserRole.PRINCIPAL) return pending.filter(u => u.role === UserRole.HOD && u.collegeId === approver.collegeId);
  if (approver.role === UserRole.HOD) return pending.filter(u => u.role === UserRole.LECTURER && u.collegeId === approver.collegeId && u.department === approver.department);
  if (approver.role === UserRole.LECTURER) return pending.filter(u => u.role === UserRole.STUDENT && u.collegeId === approver.collegeId && u.department === approver.department);
  return [];
};

export const createTeam = async (name: string, user: User): Promise<Team> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const docRef = await addDoc(collection(db, 'teams'), {
    name,
    code,
    members: [{ userId: user.id, name: user.name, role: 'Leader', avatar: user.avatar }],
    projectIds: []
  });
  const team = { id: docRef.id, name, code, members: [{ userId: user.id, name: user.name, role: 'Leader' as const, avatar: user.avatar }], projectIds: [] };
  await updateDoc(docRef, { id: docRef.id });
  return team;
};

export const joinTeam = async (code: string, user: User): Promise<Team> => {
  const snap = await getDocs(query(collection(db, 'teams'), where('code', '==', code.trim())));
  if (snap.empty) throw new Error('Invalid code.');
  const team = mapDoc<Team>(snap.docs[0]);
  if (team.members.some(m => m.userId === user.id)) throw new Error('Already a member.');
  const updatedMembers = [...team.members, { userId: user.id, name: user.name, role: 'Member' as const, avatar: user.avatar }];
  await updateDoc(doc(db, 'teams', team.id), { members: updatedMembers });
  return { ...team, members: updatedMembers };
};

export const createProject = async (data: { title: string, description: string, competitionId: string }, teamId: string, user: User): Promise<Project> => {
  const teamSnap = await getDoc(doc(db, 'teams', teamId));
  if (!teamSnap.exists()) throw new Error("Team not found");
  const team = mapDoc<Team>(teamSnap);
  const newProject = {
    title: data.title,
    description: data.description,
    teamName: team.name,
    studentId: user.id,
    competitionId: data.competitionId,
    phase: ProjectPhase.DESIGN,
    score: 0,
    lastUpdated: new Date().toISOString()
  };
  const docRef = await addDoc(collection(db, 'projects'), newProject);
  await updateDoc(docRef, { id: docRef.id });
  await updateDoc(doc(db, 'teams', teamId), { projectIds: [...(team.projectIds || []), docRef.id] });
  return { ...newProject, id: docRef.id } as Project;
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

export const deleteUserAccount = async (uid: string) => {
  await deleteDoc(doc(db, 'users', uid));
};

export const approveUser = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), { status: 'Active' });
};

export const rejectUser = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), { status: 'Rejected' });
};

export const addCollege = async (details: Partial<College>, customId?: string, logoFile?: File): Promise<College> => {
  const colRef = collection(db, 'colleges');
  const docRef = customId ? doc(colRef, customId.trim()) : doc(colRef);
  
  let logoUrl = '';
  let logoFileName = '';
  if (logoFile) {
     const upload = await uploadImage(logoFile, `colleges/${docRef.id}/${logoFile.name}`);
     logoUrl = upload.url;
     logoFileName = logoFile.name;
  }

  const newCollege: College = {
    id: docRef.id,
    name: details.name || 'Unnamed Institution',
    emailId: details.emailId || '',
    website: details.website || '',
    address: details.address || '',
    contactPhone: details.contactPhone || '',
    status: 'Active',
    createdAt: new Date().toISOString(),
    logoUrl: logoUrl || "",
    logoFileName: logoFileName || ""
  };

  await setDoc(docRef, newCollege);
  await logActivity(null, 'COLLEGE_ADD', `Registered Institution: ${newCollege.name} (ID: ${newCollege.id})`, 'success');
  return newCollege;
};

export const updateCollegeStatus = async (id: string, status: 'Active' | 'Suspended') => {
  await updateDoc(doc(db, 'colleges', id), { status });
};

export const removeCollege = async (id: string) => {
  await deleteDoc(doc(db, 'colleges', id));
};

export const resetDatabase = () => {
  localStorage.clear();
  window.location.reload();
};