'use client';

import { cn } from '@/lib/utils';

/**
 * Composant Logo Kabapo - Reproduction fidèle du symbole de la marque.
 * Utilise des dégradés SVG pour refléter le dynamisme et le professionnalisme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
    >
      <defs>
        {/* Gradient pour l'anneau principal : Cyan vers Violet */}
        <linearGradient
          id="ringGradient"
          x1="250"
          y1="250"
          x2="750"
          y2="750"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#33CCFF" />
          <stop offset="100%" stopColor="#6600CC" />
        </linearGradient>

        {/* Gradient pour la flèche : Rose vers Orange */}
        <linearGradient
          id="arrowGradient"
          x1="500"
          y1="500"
          x2="750"
          y2="250"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF0066" />
          <stop offset="100%" stopColor="#FF9933" />
        </linearGradient>
      </defs>

      {/* Anneau principal avec ses protrusions (X/Y shape) */}
      <path
        d="M320 280 L220 280 L220 380 Q220 120 512 120 Q804 120 804 412 Q804 704 512 704 Q360 704 260 600 L220 700 L360 700 Q512 804 712 704 L812 804 L912 704 L812 604 Q912 412 812 212 L912 112 L812 12 L712 112 Q512 12 320 112 Z"
        fill="url(#ringGradient)"
        style={{ opacity: 0.9 }}
      />

      {/* Cercle blanc intérieur (Cible) */}
      <circle cx="512" cy="512" r="140" fill="white" />

      {/* Flèche de croissance partant du centre */}
      <path
        d="M512 512 L750 274 L620 274 L750 144 L880 274 L750 404 L750 274 Z"
        fill="url(#arrowGradient)"
      />
      
      {/* Point d'origine de la flèche (Cercle au centre) */}
      <circle cx="512" cy="512" r="80" fill="#FF0066" />
    </svg>
  );
}
