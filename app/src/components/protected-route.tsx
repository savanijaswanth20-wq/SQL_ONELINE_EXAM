import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/exam-shell";
import { ShieldWarning, ArrowLeft, UserCircle } from "@phosphor-icons/react";
import type { UserRole } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, profile } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      const redirectParam = encodeURIComponent(currentPath);
      window.location.replace(`/login?redirect=${redirectParam}`);
    }
  }, [user, loading]);

  if (loading) {
    return <Loading label="Verifying your authorization..." />;
  }

  if (!user) {
    return <Loading label="Redirecting to sign in..." />;
  }

  // Check role-based permission
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <main className="unauthorized-card content-wrap">
        <div className="unauthorized-box">
          <ShieldWarning size={48} className="unauthorized-icon" />
          <span className="eyebrow">RESTRICTED ACCESS</span>
          <h1>Access Restricted</h1>
          <p>
            Your current role is{" "}
            <span className="role-pill-inline">{role.toUpperCase()}</span>.
            This area requires one of the following permissions:{" "}
            <strong>{allowedRoles.map((r) => r.toUpperCase()).join(", ")}</strong>.
          </p>

          <div className="user-details-summary">
            <UserCircle size={22} />
            <div>
              <strong>{profile?.full_name || user.email}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <div className="unauthorized-actions">
            <a href="/" className="back-btn">
              <ArrowLeft size={16} /> Return to overview
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
