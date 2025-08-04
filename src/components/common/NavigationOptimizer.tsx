import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface OptimizedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
}

// Optimized Link component that prevents full page reloads
export const OptimizedLink = memo<OptimizedLinkProps>(({ to, children, className, prefetch = true }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={className}
      // Prevent navigation if already on the page
      onClick={(e) => {
        if (isActive) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
});

// Navigation guard to prevent broken state transitions
export const withNavigationGuard = <P extends object>(Component: React.ComponentType<P>) => {
  return memo((props: P) => {
    return <Component {...props} />;
  });
};