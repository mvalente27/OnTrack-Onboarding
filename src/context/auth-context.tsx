// src/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { 
  onAuthChange,
  signInWithEmail as firebaseSignIn,
  signUpWithEmail as firebaseSignUp,
  signOutUser as firebaseSignOut
} from '@/lib/firebase/auth';
import { Loader2 } from 'lucide-react';
import { getUser } from '@/lib/firebase/services';
import type { AppUser, Role, Permission } from '@/lib/types';
import { getRole } from '@/lib/firebase/services/roles';
import { availablePermissions } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  permissions: Permission[];
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, fullName: string, companyName: string) => Promise<User>;
  signOutUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setIsLoading(true);
      setUser(user);
      if (user) {
        // User is signed in, fetch their profile and role
        const profile = await getUser(user.uid);
        setAppUser(profile);
        if (profile?.roleId) {
          const role = await getRole(profile.roleId);
          if (role?.permissions) {
            // Give 'manage_all' full permissions
            if (role.permissions.includes('manage_all')) {
                setPermissions(availablePermissions);
            } else {
                setPermissions(role.permissions);
            }
          } else {
            setPermissions([]);
          }
        } else {
          setPermissions([]);
        }
        if (isInitialLoad) {
            router.replace('/');
        }
      } else {
        // User is signed out
        setAppUser(null);
        setPermissions([]);
        router.replace('/login');
      }
      setIsLoading(false);
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, [router, isInitialLoad]);

  const signOutUser = async () => {
    await firebaseSignOut();
    // The onAuthChange listener will handle the redirect to /login
  };


  const hasPermission = useCallback((permission: Permission): boolean => {
    // Super admin can do anything
    if (permissions.includes('manage_all')) {
        return true;
    }
    return permissions.includes(permission);
  }, [permissions]);


  const value = {
    user,
    appUser,
    permissions,
    isLoading: isInitialLoad, // Expose only initial load status to prevent layout shifts
    signInWithEmail: firebaseSignIn,
    signUpWithEmail: firebaseSignUp,
    signOutUser,
    hasPermission,
  };

  // Show a global loader only on the very first load
  if (isInitialLoad) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
