'use client';

import * as LucideIcons from 'lucide-react';
import { type LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof LucideIcons;
}

const Icon = ({ name, ...props }: IconProps) => {
  const SelectedIcon = LucideIcons[name] as React.ComponentType<LucideProps>;

  if (!SelectedIcon) {
    const FallbackIcon = LucideIcons.CircleHelp || LucideIcons.Package;
    return <FallbackIcon {...props} />;
  }

  return <SelectedIcon {...props} />;
};

export default Icon;
