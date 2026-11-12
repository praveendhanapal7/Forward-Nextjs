"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Trash2, ShieldCheck, ShieldOff, Activity, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import "@/styles/Pages.css";

interface PersonPermissions {
  isActive?: boolean;
  canDeleteLeads?: boolean;
}

interface Person {
  email: string;
  name: string | null;
  phoneNumber: string | null;
  accountType: string | null;
  brandName: string | null;
  permissions: PersonPermissions | null;
  sessions: { createdAt: string }[];
}

interface ActivityEntry {
  id: string;
  leadId: number;
  userEmail: string | null;
  userName: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  lead: {
    id: number;
    phoneNumber: string | null;
    requirements: string | null;
    clientName: string | null;
  };
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  }
  return email[0].toUpperCase();
}

function getAccountTypeLabel(type: string | null) {
  switch (type) {
    case "agency": return "Agency";
    case "client": return "Brand Owner";
    case "staff": return "Staff";
    default: return type ?? "Unknown";
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "lead_added": return "Added a lead";
    case "status_changed": return "Changed status";
    case "note_saved": return "Saved notes";
    case "visit_assigned": return "Assigned store visit";
    case "visit_removed": return "Removed store visit";
    default: return action.replace(/_/g, " ");
  }
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PeoplePage() {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/people");
      setPeople(Array.isArray(data) ? (data as Person[]) : []);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await apiFetch("/api/activity?limit=30");
      setActivities(Array.isArray(data) ? (data as ActivityEntry[]) : []);
    } catch {
      // non-critical
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
    loadActivity();
  }, [loadPeople, loadActivity]);

  const updatePermission = async (
    email: string,
    key: "isActive" | "canDeleteLeads",
    value: boolean,
  ) => {
    setUpdatingEmail(email);
    try {
      const updated = (await apiFetch(`/api/people/${encodeURIComponent(email)}`, {
        method: "PATCH",
        body: { [key]: value },
      })) as Person;
      setPeople((prev) => prev.map((p) => (p.email === email ? { ...p, permissions: updated.permissions } : p)));
      showToast("success", `Permission updated.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to update permission.");
    } finally {
      setUpdatingEmail(null);
    }
  };

  const deletePerson = async (email: string, name: string | null) => {
    if (!window.confirm(`Delete ${name ?? email}? This cannot be undone.`)) return;
    setDeletingEmail(email);
    try {
      await apiFetch(`/api/people/${encodeURIComponent(email)}`, { method: "DELETE" });
      setPeople((prev) => prev.filter((p) => p.email !== email));
      showToast("success", `${name ?? email} has been removed.`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to delete account.");
    } finally {
      setDeletingEmail(null);
    }
  };

  const isActive = (p: Person) => (p.permissions as PersonPermissions | null)?.isActive ?? true;
  const canDeleteLeads = (p: Person) => (p.permissions as PersonPermissions | null)?.canDeleteLeads ?? true;

  return (
    <section className="PageShell">
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "success" ? "#166534" : "#b91c1c",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="PageHero">
        <p className="PageTag">Admin</p>
        <h2 style={{ fontWeight: 400, marginTop: 10, marginBottom: 10 }}>
          People &amp; Permissions
        </h2>
        <p className="PageLead">
          Manage team members who have joined with your access code.
        </p>
      </div>

      {/* People list */}
      <div className="PageSection">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className="PageSectionTitle" style={{ margin: 0 }}>
            <Users size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Team Members ({loading ? "…" : people.length})
          </h2>
          <button
            onClick={loadPeople}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 6 }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loading && (
          <div className="InfoCard" style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="Spinner" />
          </div>
        )}

        {!loading && error && (
          <div className="InfoCard">
            <p style={{ color: "#b91c1c" }}>{error}</p>
          </div>
        )}

        {!loading && !error && people.length === 0 && (
          <div className="InfoCard">
            <p style={{ color: "#6b7280" }}>No team members yet. When someone signs up with your access code, they will appear here.</p>
          </div>
        )}

        {!loading && people.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {people.map((person) => {
              const active = isActive(person);
              const canDelete = canDeleteLeads(person);
              const isMe = person.email === user?.email;
              const busy = updatingEmail === person.email || deletingEmail === person.email;

              return (
                <div
                  key={person.email}
                  className="InfoCard"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    opacity: active ? 1 : 0.7,
                    borderLeft: isMe ? "3px solid #2563eb" : undefined,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: active ? "#dbeafe" : "#f3f4f6",
                      color: active ? "#1d4ed8" : "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(person.name, person.email)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{person.name ?? person.email}</strong>
                      {isMe && (
                        <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 20 }}>
                          You
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: person.accountType === "client" ? "#fef3c7" : person.accountType === "agency" ? "#ede9fe" : "#f3f4f6",
                          color: person.accountType === "client" ? "#92400e" : person.accountType === "agency" ? "#6d28d9" : "#374151",
                        }}
                      >
                        {getAccountTypeLabel(person.accountType)}
                      </span>
                      {!active && (
                        <span style={{ fontSize: 11, background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 20 }}>
                          Suspended
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {person.email}
                      {person.brandName && ` · ${person.brandName}`}
                    </div>
                  </div>

                  {/* Permissions (not for self) */}
                  {!isMe && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        onClick={() => updatePermission(person.email, "isActive", !active)}
                        disabled={busy}
                        title={active ? "Suspend account" : "Reactivate account"}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: active ? "#d1d5db" : "#fca5a5",
                          background: active ? "#f9fafb" : "#fee2e2",
                          color: active ? "#374151" : "#b91c1c",
                          cursor: busy ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {active ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                        {active ? "Active" : "Suspended"}
                      </button>

                      <label
                        style={{ display: "flex", alignItems: "center", gap: 6, cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 500, color: "#374151" }}
                      >
                        <input
                          type="checkbox"
                          checked={canDelete}
                          disabled={busy}
                          onChange={(e) => updatePermission(person.email, "canDeleteLeads", e.target.checked)}
                          style={{ accentColor: "#2563eb", width: 15, height: 15 }}
                        />
                        Can delete leads
                      </label>

                      <button
                        onClick={() => deletePerson(person.email, person.name)}
                        disabled={busy || deletingEmail === person.email}
                        title="Delete account"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1px solid #fca5a5",
                          background: "#fff5f5",
                          color: "#b91c1c",
                          cursor: busy ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Trash2 size={13} />
                        {deletingEmail === person.email ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="PageSection">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className="PageSectionTitle" style={{ margin: 0 }}>
            <Activity size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Recent Activity
          </h2>
          <button
            onClick={loadActivity}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 6 }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {activityLoading && (
          <div className="InfoCard" style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="Spinner" />
          </div>
        )}

        {!activityLoading && activities.length === 0 && (
          <div className="InfoCard">
            <p style={{ color: "#6b7280" }}>No activity recorded yet. Actions on leads will appear here.</p>
          </div>
        )}

        {!activityLoading && activities.length > 0 && (
          <div className="InfoCard" style={{ padding: "8px 0" }}>
            {activities.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < activities.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: entry.action === "lead_added" ? "#2563eb" : entry.action === "status_changed" ? "#7c3aed" : entry.action.startsWith("visit") ? "#d97706" : "#6b7280",
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.4 }}>
                    <strong>{entry.userName ?? entry.userEmail ?? "Unknown"}</strong>
                    {" "}
                    <span style={{ color: "#6b7280" }}>{getActionLabel(entry.action)}</span>
                    {" · "}
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>Lead #{entry.leadId}</span>
                    {entry.lead.phoneNumber && (
                      <span style={{ color: "#6b7280", fontSize: 12 }}> ({entry.lead.phoneNumber})</span>
                    )}
                  </div>
                  {entry.details && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{entry.details}</div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
