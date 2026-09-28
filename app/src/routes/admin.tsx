import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, ErrorBox, Loading } from "@/components/exam-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { getSupabase, type Profile, type UserRole, type DbExamAttempt } from "@/lib/supabase";
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
  const [activeTab, setActiveTab] = useState<"profiles" | "exams">("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attempts, setAttempts] = useState<DbExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabase();
      // Fetch profiles
      const { data: profileData, error: fetchErr } = await client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }
      setProfiles((profileData as Profile[]) || []);

      // Fetch exam attempts
      const { data: attemptData, error: attemptErr } = await client
        .from("exam_attempts")
        .select("*")
        .order("started_at", { ascending: false });

      if (!attemptErr && attemptData) {
        setAttempts(attemptData as DbExamAttempt[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
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

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Are you sure you want to delete this exam attempt record?")) return;
    setUpdatingId(attemptId);
    setError(null);
    setSuccess(null);
    try {
      const client = getSupabase();
      const { error: deleteErr } = await client
        .from("exam_attempts")
        .delete()
        .eq("id", attemptId);

      if (deleteErr) {
        throw new Error(deleteErr.message);
      }

      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setSuccess("Exam attempt deleted successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete attempt";
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
          <h1>Admin Control Panel</h1>
          <p className="muted">
            View and manage all registered GitHub user profiles, role permissions, and student exam results.
          </p>
        </div>

        {error && <ErrorBox message={error} retry={fetchData} />}
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
            <span>STUDENTS</span>
            <strong>
              {profiles.filter((p) => p.role === "student" || p.role === "customer").length}
            </strong>
          </div>
          <div className="stat-card">
            <span>ADMINISTRATORS</span>
            <strong>{profiles.filter((p) => p.role === "admin").length}</strong>
          </div>
          <div className="stat-card">
            <span>EXAM ATTEMPTS</span>
            <strong>{attempts.length}</strong>
          </div>
          <button
            type="button"
            className="refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <ArrowsClockwise size={16} /> Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            className={`refresh-btn ${activeTab === "profiles" ? "active-tab" : ""}`}
            style={{
              background: activeTab === "profiles" ? "var(--primary-color, #2563eb)" : "transparent",
              color: activeTab === "profiles" ? "#fff" : "inherit",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab("profiles")}
          >
            User Profiles ({profiles.length})
          </button>
          <button
            type="button"
            className={`refresh-btn ${activeTab === "exams" ? "active-tab" : ""}`}
            style={{
              background: activeTab === "exams" ? "var(--primary-color, #2563eb)" : "transparent",
              color: activeTab === "exams" ? "#fff" : "inherit",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab("exams")}
          >
            All Exam Results ({attempts.length})
          </button>
        </div>

        {loading ? (
          <Loading label="Loading admin data..." />
        ) : activeTab === "profiles" ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>GitHub ID</th>
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
                        <span className="mono">{p.github_id || "—"}</span>
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
                          <option value="student">Student (Default)</option>
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      No user profiles recorded yet in Supabase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student / User</th>
                  <th>Attempt ID</th>
                  <th>Status</th>
                  <th>Scores</th>
                  <th>Grade</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const studentProfile = profiles.find((p) => p.id === a.user_id);
                  const isUpdating = updatingId === a.id;
                  const totalScore = a.score_total ?? (a.score_automatic ?? 0) + (a.score_written ?? 0);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div>
                          <strong>{a.name || studentProfile?.full_name || "Student"}</strong>
                          <div>
                            <small className="mono">
                              {studentProfile?.email || a.student_id || a.user_id.slice(0, 8)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mono">{a.id.slice(0, 8)}...</span>
                      </td>
                      <td>
                        <span className={`role-badge status-${a.status}`}>
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{a.status === "submitted" ? `${totalScore} / 100` : "In progress"}</strong>
                        <div>
                          <small>
                            Auto: {a.score_automatic ?? 0} | Written: {a.score_written ?? 0}
                          </small>
                        </div>
                      </td>
                      <td>
                        <strong>{a.grade || (a.status === "submitted" ? (totalScore >= 50 ? "PASS" : "FAIL") : "—")}</strong>
                      </td>
                      <td>
                        <small>
                          {a.submitted_at
                            ? new Date(Number(a.submitted_at)).toLocaleString()
                            : "Active"}
                        </small>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="refresh-btn"
                          style={{ color: "#ef4444", padding: "4px 8px" }}
                          disabled={isUpdating}
                          onClick={() => handleDeleteAttempt(a.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-table-cell">
                      No exam attempts stored yet in Supabase.
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
