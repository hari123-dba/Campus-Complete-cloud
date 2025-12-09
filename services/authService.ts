import { User, UserRole } from '../types';
import { getAllUsers, getColleges } from './dataService';

export const login = async (email: string, role?: UserRole, collegeId?: string): Promise<{ user: User | null; error: string | null }> => {
  // Simulate network delay for "Production" feel
  await new Promise(resolve => setTimeout(resolve, 800));

  const users = getAllUsers();
  const colleges = getColleges();
  
  // Find user by email. If collegeId is provided (from dropdown), match that too.
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (collegeId && user && user.collegeId !== collegeId) {
     return { user: null, error: 'User not found in this college.' };
  }

  // If role is provided (Demo Login), ensure it matches
  if (role && user && user.role !== role) {
     return { user: null, error: `Credentials invalid for ${role} role.` };
  }
  
  if (user) {
    // Check College Status
    const userCollege = colleges.find(c => c.id === user?.collegeId);
    if (userCollege && userCollege.status === 'Suspended') {
      return { user: null, error: 'Access to this institution has been temporarily suspended.' };
    }

    if (user.status === 'Pending') {
      return { user: null, error: 'Account pending approval from Administrator.' };
    }
    if (user.status === 'Rejected') {
      return { user: null, error: 'Account access has been denied.' };
    }

    localStorage.setItem('cc_session', JSON.stringify(user));
    return { user: user, error: null };
  }

  return { user: null, error: 'Invalid credentials or user not found.' };
};

export const logout = async () => {
    localStorage.removeItem('cc_session');
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));
};

export const getSession = (): User | null => {
  const session = localStorage.getItem('cc_session');
  return session ? JSON.parse(session) : null;
};
