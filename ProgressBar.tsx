'use client';

import { Progress } from '@/components/ui/progress';

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

const stepLabels = ["Type d'événement", 'Services', 'Détails'];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Étape {currentStep} sur {totalSteps}
        </p>
        <p className="text-sm font-medium text-primary">{stepLabels[currentStep - 1]}</p>
      </div>
      <Progress value={progressPercentage} className="w-full h-2" />
    </div>
  );
}
