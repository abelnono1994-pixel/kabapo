"use client";

import { useState, useEffect } from 'react';

export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // By always rendering the span, we ensure the DOM structure is the same
  // on the server and the initial client render. The content is filled in after hydration.
  return <span>{year}</span>;
}
