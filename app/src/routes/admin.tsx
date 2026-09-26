import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, ErrorBox, Loading } from "@/components/exam-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { getSupabase, type Profile, type UserRole } from "@/lib/supabase";
import {
  Shield,
  UserCheck,
  CheckCircle,
  WarningCircle,
  Clock,
  ArrowsClockwise,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | MySQL Exam Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPageWrapper,
});

function AdminPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabase();
      const { data, error: fetchErr } = await client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }
      setProfiles((data as Profile[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load profiles";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    setError(null);
    setSuccess(null);
    try {
      const client = getSupabase();
      const { error: updateErr } = await client
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setSuccess(`Role updated to ${newRole.toUpperCase()} successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Shell active="admin">
      <main className="content-wrap admin-page">
        <div className="page-title">
          <span className="eyebrow">ADMINISTRATION & AUTHORIZATION</span>
          <h1>User Profiles & Role Management</h1>
          <p className="muted">
            Manage authenticated GitHub user profiles and enforce role permissions (Admin, Staff, Customer).
          </p>
        </div>

        {error && <ErrorBox message={error} retry={fetchProfiles} />}
        {success && (
          <div className="success-banner" role="status">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <div className="admin-actions-bar">
          <div className="stat-card">
            <span>TOTAL PROFILES</span>
            <strong>{profiles.length}</strong>
          </div>
          <div className="stat-card">
            <span>ADMINISTRATORS</span>
            <strong>{profiles.filter((p) => p.role === "admin").length}</strong>
          </div>
          <div className="stat-card">
            <span>STAFF</span>
            <strong>{profiles.filter((p) => p.role === "staff").length}</strong>
          </div>
          <div className="stat-card">
            <span>CUSTOMERS</span>
            <strong>{profiles.filter((p) => p.role === "customer").length}</strong>
          </div>
          <button
            type="button"
            className="refresh-btn"
            onClick={fetchProfiles}
            disabled={loading}
          >
            <ArrowsClockwise size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <Loading label="Loading registered profiles..." />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Created</th>
                  <th>Authorize Role</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const isCurrent = p.id === user?.id;
                  const isUpdating = updatingId === p.id;
                  return (
                    <tr key={p.id} className={isCurrent ? "current-user-row" : ""}>
                      <td>
                        <div className="table-user-cell">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt=""
                              className="user-avatar-small"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="user-avatar-fallback">
                              {(p.full_name || p.email || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <strong>
                              {p.full_name || p.github_username || "Unnamed User"}
                              {isCurrent && <span className="you-pill">You</span>}
                            </strong>
                            <small className="mono">
                              {p.github_username ? `@${p.github_username} · ` : ""}
                              {p.id.slice(0, 8)}...
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="email-text">{p.email || "No email"}</span>
                      </td>
                      <td>
                        <span className={`role-badge role-badge-${p.role}`}>
                          {p.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Clock size={13} />
                          <small>
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString()
                              : "—"}
                          </small>
                        </div>
                      </td>
                      <td>
                        <select
                          className="role-selector"
                          value={p.role}
                          disabled={isUpdating}
                          onChange={(e) =>
                            handleRoleChange(p.id, e.target.value as UserRole)
                          }
                          aria-label={`Change role for ${p.full_name || p.email}`}
                        >
                          <option value="customer">Customer (Default)</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-table-cell">
                      No profiles recorded yet in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </Shell>
  );
}
