'use client';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LogOut, User as UserIcon, FileText, Settings } from 'lucide-react';
import Link from 'next/link';

export function UserNav({ user }: { user: User }) {
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };
  
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ''} />
                <AvatarFallback className="bg-primary/20">{userInitial.toUpperCase()}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'Utilisateur'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="cursor-pointer hidden lg:flex">
          <Link href="/profil">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer hidden lg:flex">
          <Link href="/mes-reservations">
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Mes réservations</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="hidden lg:block" />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/legal">
            <FileText className="mr-2 h-4 w-4" />
            <span>Légal & Confidentialité</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
