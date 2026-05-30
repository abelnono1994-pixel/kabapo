'use client';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

export function HtmlLangUpdater() {
    const { locale } = useTranslation();

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return null; // This component renders nothing
}
