'use client';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { BookingFlow } from './BookingFlow';

type BookingTriggerProps = {
  initialServiceId?: string;
  children: React.ReactNode;
  asChild?: boolean;
};

export function BookingTrigger({ initialServiceId, children, asChild = true }: BookingTriggerProps) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild={asChild}>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-auto max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <BookingFlow initialServiceId={initialServiceId} closeModal={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}