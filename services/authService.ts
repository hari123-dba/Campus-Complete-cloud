import { User, UserRole } from '../types';
import { getAllUsers, getColleges } from './dataService';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const login = async (email: string, role?: UserRole, collegeId?: string): Promise<{ user: User | null; error: string | null }> => {
  // MOCK LOGIN STRATEGY (For Demo Mode)
  // This uses local seed data instead of Firebase Auth
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      // Optional: Check college context if provided
      if (collegeId && user.collegeId && user.collegeId !== collegeId && user.role !== UserRole.ADMIN) {
         return { user: null, error: "User belongs to a different institution." };
      }

      // Save mock session
      localStorage.setItem('cc_session', JSON.stringify(user));
      return { user, error: null };
    }

    return { user: null, error: "User not found in demo database." };
  } catch (e) {
      console.error(e);
      return { user: null, error: "An unexpected error occurred during demo login." };
  }
};

// New function for Firebase Login
export const firebaseLogin = async (email: string, password: string): Promise<{ user: any | null; error: string | null }> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Check for Email Verification
        if (!fbUser.emailVerified) {
            await signOut(auth);
            return { user: null, error: "Email not verified. Please check your inbox." };
        }
        
        // Construct a generic User object since we aren't fetching full profile from DB
        const appUser: any = {
            id: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0],
            email: fbUser.email || email,
            role: UserRole.STUDENT, // Defaulting to Student as we aren't saving/fetching role info
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            status: 'Active',
            collegeId: 'col_1' // Default for demo
        };
        
        // Persist session
        localStorage.setItem('cc_session', JSON.stringify(appUser));
        
        return { user: appUser, error: null };
    } catch (error: any) {
        console.error("Firebase Login Error:", error.code);
        let errorMessage = "An error occurred";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
            errorMessage = "Password or Email Incorrect";
        } else {
            errorMessage = error.message;
        }
        return { user: null, error: errorMessage };
    }
};

export const signInWithGoogle = async (): Promise<{ user: any | null; error: string | null }> => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        
        // Construct generic user object
        // Note: In a real app, you might check Firestore to see if this user already has a role assigned.
        // Here we default to Student.
        const appUser: any = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0],
            email: fbUser.email,
            role: UserRole.STUDENT, 
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            status: 'Active',
            collegeId: 'col_1'
        };

        // Persist session
        localStorage.setItem('cc_session', JSON.stringify(appUser));
        return { user: appUser, error: null };

    } catch (error: any) {
        console.error("Google Sign In Error", error);
        return { user: null, error: error.message };
    }
};

export const firebaseSignup = async (email: string, password: string, name: string): Promise<{ user: any | null; error: string | null }> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with name
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: name
            });
            // Send Verification Email
            await sendEmailVerification(auth.currentUser);
            // Sign out immediately to prevent auto-login before verification
            await signOut(auth);
        }

        // Return a partial user object to indicate success to the caller
        const appUser: any = {
            email: email,
            name: name
        };

        return { user: appUser, error: null };
    } catch (error: any) {
        console.error("Firebase Signup Error:", error.code);
        let errorMessage = "Registration failed";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "User already exists. Sign in?";
        } else {
            errorMessage = error.message;
        }
        return { user: null, error: errorMessage };
    }
};

export const sendPasswordReset = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, error: null };
    } catch (error: any) {
        console.error("Reset Password Error:", error.code);
        let errorMessage = "Failed to send reset email.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address.";
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = "User not found.";
        }
        return { success: false, error: errorMessage };
    }
};

export const logout = async () => {
    try {
        await auth.signOut();
    } catch (e) {
        // Ignore if already signed out
    }
    localStorage.removeItem('cc_session');
};

export const getSession = (): User | null => {
  const session = localStorage.getItem('cc_session');
  return session ? JSON.parse(session) : null;
};