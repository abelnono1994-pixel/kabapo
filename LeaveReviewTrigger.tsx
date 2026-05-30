'use client';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LeaveReviewDialog } from './LeaveReviewDialog';

type LeaveReviewTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

export function LeaveReviewTrigger({ children, asChild = true }: LeaveReviewTriggerProps) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild={asChild}>
                {children}
            </DialogTrigger>
            <LeaveReviewDialog isOpen={open} setIsOpen={setOpen} />
        </Dialog>
    );
}
