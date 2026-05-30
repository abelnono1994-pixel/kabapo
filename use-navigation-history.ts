'use client';

const LAST_ROUTE_KEY = 'lastValidRoute';

export const useNavigationHistory = () => {
  const saveLastRoute = (route: string) => {
    // Prevent saving auth-related routes as the last valid route
    if (route.includes('/login') || route.includes('/admin')) {
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LAST_ROUTE_KEY, route);
    }
  };

  const popLastRoute = (): string | null => {
    if (typeof window !== 'undefined') {
      const route = sessionStorage.getItem(LAST_ROUTE_KEY);
      sessionStorage.removeItem(LAST_ROUTE_KEY);
      return route;
    }
    return null;
  };

  return { saveLastRoute, popLastRoute };
};
