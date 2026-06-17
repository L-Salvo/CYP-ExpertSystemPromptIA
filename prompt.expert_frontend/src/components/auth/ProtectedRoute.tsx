import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store/session.store';

/** Wraps routes that require an authenticated session. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

/**
 * Wraps auth routes (login/register): authenticated users are redirected away.
 * Onboarding-aware so a freshly registered (not-yet-onboarded) user lands on the
 * wizard instead of the chat — and it cannot lose a race with manual navigation,
 * because both point to the same onboarding-aware target.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const user = useSessionStore((s) => s.user);
  if (isAuthenticated) {
    const target = user && !user.onboardingComplete ? '/onboarding' : '/';
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}
