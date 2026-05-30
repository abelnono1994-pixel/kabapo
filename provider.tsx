'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, type Auth, type User } from 'firebase/auth';

import { firebaseConfig } from '@/firebase/config';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, Settings, Package, Heart, Phone, LogIn, ShoppingCart, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


// --- START BOTTOM NAV BAR ---
type UserProfile = {
  role: 'client' | 'shop_admin' | 'admin' | 'superadmin';
  shopId?: string;
};


type BottomNavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

const BottomNavItem = ({ href, icon, label }: BottomNavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && !href.startsWith('/#') && pathname.startsWith(href));

  return (
    <Link href={href} className={cn(
      "flex flex-1 flex-col items-center justify-center gap-1 h-full p-1 transition-colors text-center",
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
    )}>
      {icon}
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
};

const BottomNavBar = () => {
    const { user, userProfile } = useContext(FirebaseContext)!;
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const hiddenPaths = ['/admin', '/login', '/legal'];
        if (hiddenPaths.includes(pathname) || pathname.startsWith('/admin/')) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    }, [pathname]);

    if (!isVisible) return null;
    
    let navItems: BottomNavItemProps[] = [];

    const isDashboard = pathname.startsWith('/dashboard');

    if (userProfile?.role === 'shop_admin' && isDashboard) {
        navItems = [
            { href: '/dashboard', icon: <Home size={24}/>, label: 'Dashboard' },
            { href: '/dashboard/bookings', icon: <ShoppingCart size={24}/>, label: 'Réservations' },
            { href: '/dashboard/services', icon: <Package size={24}/>, label: 'Services' },
            { href: '/dashboard/gallery', icon: <ImageIcon size={24}/>, label: 'Galerie' },
            { href: '/dashboard/settings', icon: <Settings size={24}/>, label: 'Paramètres' },
        ];
    } else if (user) { // Regular authenticated user (or shop_admin outside dashboard)
        navItems = [
            { href: '/', icon: <Home size={24}/>, label: 'Accueil' },
            { href: '/#services', icon: <Package size={24}/>, label: 'Services' },
            { href: '/mes-reservations', icon: <LayoutGrid size={24}/>, label: 'Réservations' },
            { href: '/profil', icon: <Settings size={24}/>, label: 'Paramètres' },
            { href: '/#reviews', icon: <Heart size={24}/>, label: 'Avis' },
            { href: '/#contact', icon: <Phone size={24}/>, label: 'Contact' },
        ];
    } else { // Unauthenticated user
        navItems = [
            { href: '/', icon: <Home size={24}/>, label: 'Accueil' },
            { href: '/#services', icon: <Package size={24}/>, label: 'Services' },
            { href: '/login', icon: <LogIn size={24}/>, label: 'Connexion'},
            { href: '/#reviews', icon: <Heart size={24}/>, label: 'Avis' },
            { href: '/#contact', icon: <Phone size={24}/>, label: 'Contact' },
        ];
    }

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center h-full no-scrollbar overflow-x-auto">
                {navItems.map(item => <BottomNavItem key={item.href} {...item} />)}
            </div>
        </div>
    );
};
// --- END BOTTOM NAV BAR ---


interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// New interface for the profile part of the state
interface UserProfileState {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserProfileHookResult {
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firebaseServices = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }, []);

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [userProfileState, setUserProfileState] = useState<UserProfileState>({
    userProfile: null,
    isProfileLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUserAuthState({ user, isUserLoading: false, userError: null });
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserAuthState({ user: null, isUserLoading: false, userError: error });
    });
    return () => unsubscribe();
  }, [firebaseServices.auth]);

  useEffect(() => {
    if (!userAuthState.user || !firebaseServices.firestore) {
      setUserProfileState({ userProfile: null, isProfileLoading: false });
      return;
    }

    setUserProfileState(prevState => ({ ...prevState, isProfileLoading: true }));

    const userDocRef = doc(firebaseServices.firestore, 'users', userAuthState.user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfileState({ userProfile: docSnap.data() as UserProfile, isProfileLoading: false });
        } else {
          setUserProfileState({ userProfile: { role: 'client' }, isProfileLoading: false });
        }
      }, 
      (error) => {
        console.error("FirebaseProvider: Error listening to user profile:", error);
        setUserProfileState({ userProfile: null, isProfileLoading: false });
      }
    );

    return () => {
      try {
          unsubscribe();
      } catch (e) {
          // This is likely safe to ignore.
      }
    };
  }, [userAuthState.user, firebaseServices.firestore]);


  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseServices.firebaseApp && firebaseServices.firestore && firebaseServices.auth);
    // The final loading state is true if we are waiting for auth or for the profile fetch after auth is complete
    const isProfileEffectivelyLoading = userAuthState.isUserLoading || (!!userAuthState.user && userProfileState.isProfileLoading);

    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseServices.firebaseApp : null,
      firestore: servicesAvailable ? firebaseServices.firestore : null,
      auth: servicesAvailable ? firebaseServices.auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      userProfile: userProfileState.userProfile,
      isProfileLoading: isProfileEffectivelyLoading,
    };
  }, [firebaseServices, userAuthState, userProfileState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <BottomNavBar />
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isProfileLoading: context.isProfileLoading,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export const useMemoFirebase = useMemo;

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

export const useUserProfile = (): UserProfileHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a FirebaseProvider.');
  }
  return { userProfile: context.userProfile, isProfileLoading: context.isProfileLoading };
};
