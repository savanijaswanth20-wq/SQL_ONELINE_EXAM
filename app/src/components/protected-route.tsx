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

  if (loading) {
    return <Loading label="Verifying your authorization..." />;
  }

  if (!user || (allowedRoles && !allowedRoles.includes(role))) {
    return (
      <main className="unauthorized-card content-wrap">
        <div className="unauthorized-box">
          <ShieldWarning size={48} className="unauthorized-icon" />
          <span className="eyebrow">RESTRICTED ACCESS</span>
          <h1>Access Restricted</h1>
          <p>
            This section requires authorized administrative access.
          </p>
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
