"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Zap,
  Sheet,
  Check,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import "@/styles/Pages.css";
import "@/styles/Projects.css";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: { integrations: number; sources: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/projects");
      setProjects(Array.isArray(data) ? (data as Project[]) : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() || null }),
      });
      setCreateName(""); setCreateDesc(""); setShowCreate(false);
      fetchProjects();
    } catch { /* noop */ }
    finally { setCreating(false); }
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDesc(p.description ?? "");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      setEditingId(null);
      fetchProjects();
    } catch { /* noop */ }
    finally { setSaving(false); }
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? Integrations linked to it will be unlinked but not deleted.`)) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch { /* noop */ }
    finally { setDeletingId(null); }
  };

  return (
    <>
      <header className="DashTopBar">
        <div className="DashTopBarLeft">
          <span className="DashTopBarTitle">Projects</span>
        </div>
      </header>
      <section className="PageShell ProjPageShell">
        <div className="ProjTopRow">
          <div className="ProjTopRowLeft">
            <h2>Your Projects</h2>
            <p>Each project groups your integrations and lead sources together.</p>
          </div>
          <button className="ProjNewBtn" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="ProjCreateCard">
            <h3>Create a new project</h3>
            <div className="ProjFormRow">
              <div className="ProjFormField">
                <label>Project Name</label>
                <input
                  type="text"
                  className="ProjInput"
                  placeholder="e.g. Sridevi Properties, Royal Oak, etc."
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createProject()}
                  autoFocus
                />
              </div>
              <div className="ProjFormField">
                <label>Description <span style={{ fontWeight: 400, textTransform: "none", color: "#9ca3af" }}>(optional)</span></label>
                <input
                  type="text"
                  className="ProjInput"
                  placeholder="Brief description…"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="ProjFormActions">
              <button className="ProjBtnSecondary" onClick={() => { setShowCreate(false); setCreateName(""); setCreateDesc(""); }}>Cancel</button>
              <button className="ProjBtnPrimary" onClick={createProject} disabled={creating || !createName.trim()}>
                {creating ? <><Loader2 size={14} className="ProjSpinner" /> Creating…</> : "Create Project"}
              </button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="ProjLoading">
            <Loader2 size={20} className="ProjSpinner" /> Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="ProjEmpty">
            <FolderOpen size={36} style={{ opacity: 0.3 }} />
            <p>No projects yet.</p>
            <p style={{ color: "#6b7280" }}>
              Create a project to group your integrations. For example, one project per client or brand.
            </p>
            <button className="ProjNewBtn" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create your first project
            </button>
          </div>
        ) : (
          <div className="ProjGrid">
            {projects.map((p) => (
              <div className="ProjCard" key={p.id}>
                {editingId === p.id ? (
                  <div className="ProjCardEdit">
                    <input
                      className="ProjInput"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <input
                      className="ProjInput"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description…"
                    />
                    <div className="ProjCardEditRow">
                      <button className="ProjBtnSecondary" style={{ flex: 1 }} onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="ProjBtnPrimary" style={{ flex: 1 }} onClick={() => saveEdit(p.id)} disabled={saving || !editName.trim()}>
                        {saving ? <Loader2 size={13} className="ProjSpinner" /> : <Check size={13} />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ProjCardTop">
                      <div>
                        <p className="ProjCardName">{p.name}</p>
                        {p.description && <p className="ProjCardDesc">{p.description}</p>}
                      </div>
                      <div className="ProjCardActions">
                        <button className="ProjIconBtn" onClick={() => startEdit(p)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button
                          className="ProjIconBtn ProjIconBtnDanger"
                          onClick={() => deleteProject(p.id, p.name)}
                          disabled={deletingId === p.id}
                          title="Delete"
                        >
                          {deletingId === p.id ? <Loader2 size={13} className="ProjSpinner" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="ProjCardStats">
                      <span className="ProjStat">
                        <Zap size={12} style={{ color: "#2563eb" }} />
                        <span className="ProjStatVal">{p._count?.integrations ?? 0}</span>
                        <span>Meta</span>
                      </span>
                      <span className="ProjStat">
                        <Sheet size={12} style={{ color: "#16a34a" }} />
                        <span className="ProjStatVal">{p._count?.sources ?? 0}</span>
                        <span>Sheets</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
