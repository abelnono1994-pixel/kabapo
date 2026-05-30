'use client';

import { useUser } from '@/firebase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { useNavigationHistory } from '@/hooks/use-navigation-history';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { saveLastRoute } = useNavigationHistory();

  useEffect(() => {
    if (!isUserLoading && !user) {
      saveLastRoute(pathname);
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname, saveLastRoute]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
      </main>
    </>
  );
}
