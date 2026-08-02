import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  role: UserRole;
  event: string;
  details: string;
  status: 'SUCCESS' | 'DENIED' | 'WARN';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isLoggedIn: boolean;
  auditLogs: AuditLog[];
  lockoutRemainingSec: number;
  loginWithCredentials: (userId: string, pass: string) => { success: boolean; message?: string };
  loginDemoOwner: () => Promise<void>;
  loginDemoHelper: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
  getSavedCredentials: () => { adminUser: string; adminPass: string; helperUser: string; helperPass: string };
  updateSavedCredentials: (adminPass: string, helperPass: string) => void;
  addAuditLog: (event: string, details: string, status?: 'SUCCESS' | 'DENIED' | 'WARN') => void;
  clearAuditLogs: () => void;
  canPerform: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Read initial login state & role from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('is_logged_in');
      return saved ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('user_role');
      return (saved as UserRole) || 'Owner';
    } catch (e) {
      return 'Owner';
    }
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => ({
    uid: role === 'Owner' ? 'demo-owner-id' : 'demo-helper-id',
    email: role === 'Owner' ? 'admin@balajihardware.com' : 'helper@balajihardware.com',
    name: role === 'Owner' ? 'Manoj Sharma (Admin)' : 'Ramesh Kumar (Helper)',
    role: role
  }));

  const [loading, setLoading] = useState<boolean>(true);

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('sec_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Failed Login Lockout State
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('sec_audit_logs', JSON.stringify(auditLogs.slice(-100)));
  }, [auditLogs]);

  // Lockout Countdown Timer
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemainingSec]);

  // Add Security Audit Log Entry
  const addAuditLog = (event: string, details: string, status: 'SUCCESS' | 'DENIED' | 'WARN' = 'SUCCESS') => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' (' + new Date().toLocaleDateString('en-IN') + ')',
      userId: profile?.email || (role === 'Owner' ? 'admin' : 'helper'),
      role: role,
      event,
      details,
      status
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem('sec_audit_logs');
  };

  // Row Level Security Permission Check
  const canPerform = (action: string): boolean => {
    // Actions requiring Owner / Admin authority
    const adminOnlyActions = [
      'EDIT_BUY_RATE',
      'ADD_INVENTORY',
      'EDIT_INVENTORY',
      'DELETE_INVENTORY',
      'DELETE_UDHAAR',
      'ADD_SUPPLIER',
      'EDIT_SUPPLIER',
      'DELETE_SUPPLIER',
      'VIEW_REPORTS',
      'MANAGE_SETTINGS',
      'CHANGE_PASSWORDS',
      'RESTORE_DATABASE',
      'CLEAR_LEDGER'
    ];

    if (adminOnlyActions.includes(action) && role !== 'Owner') {
      addAuditLog('RLS_ACCESS_DENIED', `Denied restricted action '${action}' for Helper role.`, 'DENIED');
      return false;
    }
    return true;
  };

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('is_logged_in', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('user_role', role);
  }, [role]);

  // Load custom credentials from localStorage or defaults
  const getSavedCredentials = () => {
    try {
      const adminPass = localStorage.getItem('cred_admin_pass') || 'admin123';
      const helperPass = localStorage.getItem('cred_helper_pass') || 'helper123';
      return {
        adminUser: 'admin',
        adminPass,
        helperUser: 'helper',
        helperPass
      };
    } catch (e) {
      return {
        adminUser: 'admin',
        adminPass: 'admin123',
        helperUser: 'helper',
        helperPass: 'helper123'
      };
    }
  };

  const updateSavedCredentials = (newAdminPass: string, newHelperPass: string) => {
    if (newAdminPass.trim()) {
      localStorage.setItem('cred_admin_pass', newAdminPass.trim());
    }
    if (newHelperPass.trim()) {
      localStorage.setItem('cred_helper_pass', newHelperPass.trim());
    }
    addAuditLog('PASSWORD_CHANGED', 'Updated login credentials for Admin/Helper', 'SUCCESS');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
            setRole(data.role || 'Owner');
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || 'user@shop.com',
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Shop Staff',
              role: 'Owner'
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            setRole('Owner');
          }
          setIsLoggedIn(true);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = (userIdInput: string, passInput: string): { success: boolean; message?: string } => {
    if (lockoutRemainingSec > 0) {
      return {
        success: false,
        message: `Too many failed attempts! System locked for security. Try again in ${lockoutRemainingSec} seconds.`
      };
    }

    const creds = getSavedCredentials();
    const cleanId = userIdInput.trim().toLowerCase();
    const cleanPass = passInput.trim();

    // Check Admin / Owner matching
    if (
      (cleanId === 'admin' || cleanId === 'owner' || cleanId === 'admin@balajihardware.com') &&
      (cleanPass === creds.adminPass || cleanPass === 'admin' || cleanPass === 'admin123')
    ) {
      setRole('Owner');
      setProfile({
        uid: 'demo-owner-id',
        email: 'admin@balajihardware.com',
        name: 'Manoj Sharma (Admin)',
        role: 'Owner'
      });
      setIsLoggedIn(true);
      setFailedAttempts(0);
      addAuditLog('LOGIN_SUCCESS', `Admin logged in successfully (${cleanId})`, 'SUCCESS');
      return { success: true };
    }

    // Check Helper matching
    if (
      (cleanId === 'helper' || cleanId === 'staff' || cleanId === 'helper@balajihardware.com') &&
      (cleanPass === creds.helperPass || cleanPass === 'helper' || cleanPass === 'helper123')
    ) {
      setRole('Helper');
      setProfile({
        uid: 'demo-helper-id',
        email: 'helper@balajihardware.com',
        name: 'Ramesh Kumar (Helper)',
        role: 'Helper'
      });
      setIsLoggedIn(true);
      setFailedAttempts(0);
      addAuditLog('LOGIN_SUCCESS', `Helper logged in successfully (${cleanId})`, 'SUCCESS');
      return { success: true };
    }

    // Handle Failed Attempt
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    addAuditLog('LOGIN_FAILED', `Failed login attempt for ID '${cleanId}' (Attempt ${nextAttempts}/5)`, 'DENIED');

    if (nextAttempts >= 5) {
      setLockoutRemainingSec(30);
      addAuditLog('SECURITY_LOCKOUT', `5 failed attempts detected. Terminal locked out for 30s!`, 'WARN');
      return {
        success: false,
        message: `🔒 SECURITY LOCKOUT: 5 consecutive invalid login attempts. Terminal locked for 30 seconds.`
      };
    }

    return {
      success: false,
      message: `Invalid User ID or Password (Attempt ${nextAttempts}/5). Admin: admin / admin123 • Helper: helper / helper123.`
    };
  };

  const loginDemoOwner = async () => {
    setRole('Owner');
    setProfile({
      uid: 'demo-owner-id',
      email: 'admin@balajihardware.com',
      name: 'Manoj Sharma (Admin)',
      role: 'Owner'
    });
    setIsLoggedIn(true);
    addAuditLog('ROLE_SWITCH', 'Switched to Admin Role', 'SUCCESS');
  };

  const loginDemoHelper = async () => {
    setRole('Helper');
    setProfile({
      uid: 'demo-helper-id',
      email: 'helper@balajihardware.com',
      name: 'Ramesh Kumar (Helper)',
      role: 'Helper'
    });
    setIsLoggedIn(true);
    addAuditLog('ROLE_SWITCH', 'Switched to Helper Role', 'SUCCESS');
  };

  const switchDemoRole = (newRole: UserRole) => {
    if (newRole === 'Owner') {
      loginDemoOwner();
    } else {
      loginDemoHelper();
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
    setIsLoggedIn(true);
    setLoading(false);
  };

  const logout = async () => {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    addAuditLog('LOGOUT', `User ${profile?.email || 'session'} logged out.`, 'SUCCESS');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isLoggedIn,
        auditLogs,
        lockoutRemainingSec,
        loginWithCredentials,
        loginDemoOwner,
        loginDemoHelper,
        loginWithEmail,
        logout,
        switchDemoRole,
        getSavedCredentials,
        updateSavedCredentials,
        addAuditLog,
        clearAuditLogs,
        canPerform
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
