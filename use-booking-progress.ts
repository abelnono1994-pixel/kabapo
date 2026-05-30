'use client';
import { useState, useEffect, useCallback } from 'react';
import type { BookingData } from '@/components/booking/BookingFlow';

const BOOKING_PROGRESS_KEY = 'bookingProgress';

export const useBookingProgress = (initialState: BookingData) => {
    const [bookingData, setBookingData] = useState<BookingData>(initialState);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(BOOKING_PROGRESS_KEY);
            if (item) {
                // When restoring, we need to convert the date string back to a Date object
                const parsed = JSON.parse(item);
                if (parsed.date) {
                    parsed.date = new Date(parsed.date);
                }
                setBookingData(parsed);
            }
        } catch (error) {
            console.warn('Error reading booking progress from localStorage', error);
        }
    }, []);

    const updateBookingData = useCallback((data: Partial<BookingData>) => {
        setBookingData(prev => {
            const newData = { ...prev, ...data };
            try {
                window.localStorage.setItem(BOOKING_PROGRESS_KEY, JSON.stringify(newData));
            } catch (error) {
                console.warn('Error saving booking progress to localStorage', error);
            }
            return newData;
        });
    }, []);
    
    const clearBookingProgress = useCallback(() => {
        try {
            window.localStorage.removeItem(BOOKING_PROGRESS_KEY);
            setBookingData(initialState);
        } catch (error) {
            console.warn('Error clearing booking progress from localStorage', error);
        }
    }, [initialState]);

    return { bookingData, updateBookingData, clearBookingProgress };
};
