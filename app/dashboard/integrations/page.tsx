"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Link2,
  RefreshCw,
  Trash2,
  Copy,
  CheckCheck,
  Plus,
  Loader2,
  Zap,
  Sheet,
  Pause,
  Play,
  Download,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import "@/styles/Pages.css";
import "@/styles/Integrations.css";

// ── Types ─────────────────────────────────────────────────
interface LeadSource {
  id: string;
  type: "google_sheets" | "meta";
  name: string;
  clientName: string | null;
  config: Record<string, string>;
  columns: string[] | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

interface MetaIntegration {
  id: string;
  name: string;
  pageId: string;
  pageName: string;
  formId: string;
  formName: string;
  status: "active" | "inactive";
  createdAt: string;
  _count?: { logs: number };
}

interface MetaPage {
  id: string;
  name: string;
  category?: string;
}

interface MetaForm {
  id: string;
  name: string;
  status?: string;
  leads_count?: number;
}

interface SyncResult {
  created: number;
  skipped: number;
  total: number;
}

interface Project {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="IntCopyBtn" onClick={copy} title="Copy">
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
    </button>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ flexShrink: 0 }}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ── Google Sheets Section ─────────────────────────────────
function SheetsSection({ projects }: { projects: Project[] }) {
  const [sheets, setSheets] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSheets = useCallback(async () => {
    try {
      const data = await apiFetch("/api/integrations/sheets");
      setSheets(Array.isArray(data) ? (data as LeadSource[]) : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  const connectSheet = async () => {
    if (!url.trim()) return;
    setConnecting(true);
    setConnectError("");
    try {
      await apiFetch("/api/integrations/sheets", {
        method: "POST",
        body: JSON.stringify({ url: url.trim(), name: name.trim() || undefined, clientName: clientName.trim() || undefined, projectId: projectId || undefined }),
      });
      setUrl(""); setName(""); setClientName(""); setProjectId(""); setShowForm(false);
      fetchSheets();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Could not connect sheet.");
    } finally { setConnecting(false); }
  };

  const syncSheet = async (id: string) => {
    setSyncingId(id);
    try {
      const result = await apiFetch(`/api/integrations/sheets/${id}/sync`, { method: "POST" }) as SyncResult;
      setSyncResults((p) => ({ ...p, [id]: result }));
      fetchSheets();
    } catch { /* noop */ }
    finally { setSyncingId(null); }
  };

  const deleteSheet = async (id: string) => {
    if (!confirm("Disconnect this sheet? Leads already imported are kept.")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/integrations/sheets/${id}`, { method: "DELETE" });
      fetchSheets();
    } catch { /* noop */ }
    finally { setDeletingId(null); }
  };

  return (
    <div className="IntCard">
      <div className="IntCardHeader">
        <div className="IntCardTitle">
          <Sheet size={18} className="IntCardIcon IntCardIconGreen" />
          <span>Google Sheets</span>
          <span className="IntBadge IntBadgeGreen">{sheets.length} connected</span>
        </div>
        <button className="IntAddBtn" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} />
          Connect Sheet
        </button>
      </div>

      {showForm && (
        <div className="IntForm">
          <div className="IntFormRow">
            <div className="IntFormField">
              <label>Google Sheet URL</label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="IntInput"
              />
              <span className="IntFieldHint">Share → "Anyone with the link can view", then paste URL.</span>
            </div>
            <div className="IntFormField IntFormFieldSm">
              <label>Name <span className="IntOptional">(optional)</span></label>
              <input type="text" placeholder="e.g. Real Estate Leads Jan" value={name} onChange={(e) => setName(e.target.value)} className="IntInput" />
            </div>
            <div className="IntFormField IntFormFieldSm">
              <label>Client / Brand <span className="IntOptional">(optional)</span></label>
              <input type="text" placeholder="e.g. Prestige Homes" value={clientName} onChange={(e) => setClientName(e.target.value)} className="IntInput" />
            </div>
            {projects.length > 0 && (
              <div className="IntFormField IntFormFieldSm">
                <label>Project <span className="IntOptional">(optional)</span></label>
                <select className="IntSelect" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {connectError && <p className="IntError">{connectError}</p>}
          <div className="IntFormActions">
            <button className="IntBtnSecondary" onClick={() => { setShowForm(false); setConnectError(""); }}>Cancel</button>
            <button className="IntBtnPrimary" onClick={connectSheet} disabled={connecting || !url.trim()}>
              {connecting ? <><Loader2 size={13} className="IntSpinner" /> Connecting…</> : "Connect & Import"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="IntEmpty"><Loader2 size={18} className="IntSpinner" /> Loading…</div>
      ) : sheets.length === 0 ? (
        <div className="IntEmpty">
          <Sheet size={28} style={{ opacity: 0.3 }} />
          <p>No sheets connected yet.</p>
        </div>
      ) : (
        <div className="IntList">
          {sheets.map((s) => {
            const result = syncResults[s.id];
            return (
              <div className="IntListItem" key={s.id}>
                <div className="IntListItemMain">
                  <div className="IntListItemInfo">
                    <span className="IntListItemName">{s.name}</span>
                    <span className="IntListItemMeta">
                      {s.clientName && <span className="IntClientChip">{s.clientName}</span>}
                      {s.lastSyncedAt ? `Last synced ${timeAgo(s.lastSyncedAt)}` : "Never synced"}
                    </span>
                    {s.columns && s.columns.length > 0 && (
                      <div className="IntColumnChips">
                        {s.columns.slice(0, 6).map((col) => <span className="IntColChip" key={col}>{col}</span>)}
                        {s.columns.length > 6 && <span className="IntColChipMore">+{s.columns.length - 6} more</span>}
                      </div>
                    )}
                    {result && <span className="IntSyncResult">✓ {result.created} new, {result.skipped} skipped</span>}
                  </div>
                </div>
                <div className="IntListItemActions">
                  <button className="IntBtnSync" onClick={() => syncSheet(s.id)} disabled={syncingId === s.id} title="Sync now">
                    {syncingId === s.id ? <><Loader2 size={13} className="IntSpinner" /> Syncing…</> : <><RefreshCw size={13} /> Sync</>}
                  </button>
                  <button className="IntBtnDelete" onClick={() => deleteSheet(s.id)} disabled={deletingId === s.id} title="Disconnect">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Meta Lead Ads Section ─────────────────────────────────
function MetaSection({ projects }: { projects: Project[] }) {
  const [integrations, setIntegrations] = useState<MetaIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<Record<string, SyncResult>>({});

  // Add form state
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [oauthError, setOauthError] = useState(false);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [forms, setForms] = useState<MetaForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [intName, setIntName] = useState("");
  const [intClientName, setIntClientName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await apiFetch("/api/meta/integrations");
      setIntegrations(Array.isArray(data) ? (data as MetaIntegration[]) : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  // Detect OAuth callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_connected") === "1") {
      setAddFormOpen(true);
      window.history.replaceState({}, "", "/dashboard/integrations");
      loadPages();
    }
    if (params.get("meta_error") === "1") {
      setOauthError(true);
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPages = async () => {
    setLoadingPages(true);
    setPages([]);
    try {
      const data = await apiFetch("/api/meta/pages");
      setPages(Array.isArray(data) ? (data as MetaPage[]) : []);
    } catch { /* noop */ }
    finally { setLoadingPages(false); }
  };

  const onPageSelect = async (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedFormId("");
    setForms([]);
    if (!pageId) return;
    setLoadingForms(true);
    try {
      const data = await apiFetch(`/api/meta/pages/${pageId}/forms`);
      setForms(Array.isArray(data) ? (data as MetaForm[]) : []);
    } catch { /* noop */ }
    finally { setLoadingForms(false); }
  };

  const connectMeta = async () => {
    try {
      const { url } = await apiFetch("/api/meta/oauth/url") as { url: string };
      window.location.href = url;
    } catch { /* noop */ }
  };

  const saveIntegration = async () => {
    if (!selectedPageId || !selectedFormId) return;
    setSaving(true);
    setSaveError("");
    const page = pages.find((p) => p.id === selectedPageId);
    const form = forms.find((f) => f.id === selectedFormId);
    try {
      await apiFetch("/api/meta/integrations", {
        method: "POST",
        body: JSON.stringify({
          pageId: selectedPageId,
          pageName: page?.name,
          formId: selectedFormId,
          formName: form?.name,
          name: intName.trim() || `${page?.name ?? selectedPageId} — ${form?.name ?? selectedFormId}`,
          clientName: intClientName.trim() || undefined,
          projectId: selectedProjectId || undefined,
        }),
      });
      setAddFormOpen(false);
      setSelectedPageId(""); setSelectedFormId(""); setIntName(""); setIntClientName(""); setSelectedProjectId("");
      setPages([]); setForms([]);
      fetchIntegrations();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save integration.");
    } finally { setSaving(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    try {
      await apiFetch(`/api/meta/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: currentStatus === "active" ? "inactive" : "active" }),
      });
      fetchIntegrations();
    } catch { /* noop */ }
    finally { setTogglingId(null); }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm("Delete this integration? Leads already received are kept.")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/meta/integrations/${id}`, { method: "DELETE" });
      fetchIntegrations();
    } catch { /* noop */ }
    finally { setDeletingId(null); }
  };

  const importLeads = async (id: string) => {
    setImportingId(id);
    try {
      const result = await apiFetch(`/api/meta/integrations/${id}/import`, { method: "POST" }) as SyncResult;
      setImportResults((p) => ({ ...p, [id]: result }));
      fetchIntegrations();
    } catch { /* noop */ }
    finally { setImportingId(null); }
  };

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/meta`;
  const verifyToken = "forward_leads_webhook_2024";

  return (
    <div className="IntCard">
      <div className="IntCardHeader">
        <div className="IntCardTitle">
          <Zap size={18} className="IntCardIcon IntCardIconBlue" />
          <span>Meta Lead Ads</span>
          <span className="IntBadge IntBadgeBlue">
            {integrations.filter((i) => i.status === "active").length} active
          </span>
        </div>
        <button
          className="IntAddBtn"
          onClick={() => {
            setAddFormOpen((v) => !v);
            setPages([]);
            setForms([]);
            setSelectedPageId("");
            setSelectedFormId("");
            setIntClientName("");
            setSaveError("");
          }}
        >
          <Plus size={14} />
          Add Integration
        </button>
      </div>

      {oauthError && (
        <div className="IntMetaError">
          <AlertCircle size={15} />
          Facebook connection failed. Please try again.
        </div>
      )}

      {/* Add form */}
      {addFormOpen && (
        <div className="IntForm">
          <p className="IntMetaFormTitle">Connect a Facebook page and lead form</p>

          {pages.length === 0 && !loadingPages ? (
            <div className="IntMetaConnectBox">
              <p>Log in with Facebook to allow access to your pages and lead forms.</p>
              <button className="IntMetaConnectBtn" onClick={connectMeta}>
                <FacebookIcon />
                Continue with Facebook
              </button>
              <p className="IntMetaConnectNote">
                Required: leads_retrieval, pages_show_list, pages_manage_metadata
              </p>
            </div>
          ) : loadingPages ? (
            <div className="IntEmpty"><Loader2 size={16} className="IntSpinner" /> Loading pages…</div>
          ) : (
            <div className="IntFormRow">
              <div className="IntFormField IntFormFieldSm">
                <label>Facebook Page</label>
                <select className="IntSelect" value={selectedPageId} onChange={(e) => onPageSelect(e.target.value)}>
                  <option value="">Select a page…</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="IntFormField IntFormFieldSm">
                <label>Lead Form</label>
                {loadingForms ? (
                  <div className="IntSelectLoading"><Loader2 size={13} className="IntSpinner" /> Loading forms…</div>
                ) : (
                  <select
                    className="IntSelect"
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    disabled={!selectedPageId}
                  >
                    <option value="">Select a form…</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}{f.leads_count ? ` (${f.leads_count} leads)` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="IntFormField IntFormFieldSm">
                <label>Client / Brand</label>
                <input
                  type="text"
                  className="IntInput"
                  placeholder="e.g. Real Value"
                  value={intClientName}
                  onChange={(e) => setIntClientName(e.target.value)}
                />
                <span className="IntFieldHint">Must match the brand name to appear in that brand&apos;s leads view.</span>
              </div>
              <div className="IntFormField IntFormFieldSm">
                <label>Name <span className="IntOptional">(optional)</span></label>
                <input
                  type="text"
                  className="IntInput"
                  placeholder="e.g. Real Estate Lead Form"
                  value={intName}
                  onChange={(e) => setIntName(e.target.value)}
                />
              </div>
              {projects.length > 0 && (
                <div className="IntFormField IntFormFieldSm">
                  <label>Project <span className="IntOptional">(optional)</span></label>
                  <select className="IntSelect" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {saveError && <p className="IntError">{saveError}</p>}

          <div className="IntFormActions">
            <button className="IntBtnSecondary" onClick={() => { setAddFormOpen(false); setSaveError(""); }}>
              Cancel
            </button>
            {pages.length > 0 && (
              <button
                className="IntBtnPrimary"
                onClick={saveIntegration}
                disabled={saving || !selectedPageId || !selectedFormId}
              >
                {saving ? <><Loader2 size={13} className="IntSpinner" /> Saving…</> : "Save Integration"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Integrations list */}
      {loading ? (
        <div className="IntEmpty"><Loader2 size={18} className="IntSpinner" /> Loading…</div>
      ) : integrations.length === 0 ? (
        <div className="IntEmpty">
          <Zap size={28} style={{ opacity: 0.3 }} />
          <p>No integrations yet. Click "Add Integration" to link a Meta lead form.</p>
        </div>
      ) : (
        <div className="IntList">
          {integrations.map((int) => {
            const result = importResults[int.id];
            return (
              <div className="IntListItem" key={int.id}>
                <div className="IntListItemMain">
                  <div className="IntListItemInfo">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="IntListItemName">{int.name}</span>
                      <span className={`IntStatusPill ${int.status === "active" ? "IntStatusPillActive" : "IntStatusPillPaused"}`}>
                        {int.status === "active" ? "Active" : "Paused"}
                      </span>
                    </div>
                    <span className="IntListItemMeta">
                      <span className="IntMetaTag">{int.pageName}</span>
                      <span style={{ color: "#d1d5db" }}>→</span>
                      <span className="IntMetaTag">{int.formName}</span>
                      {int._count && int._count.logs > 0 && (
                        <span className="IntLeadCount">{int._count.logs} events</span>
                      )}
                    </span>
                    {result && (
                      <span className="IntSyncResult">
                        ✓ {result.created} new leads imported, {result.skipped} already existed
                      </span>
                    )}
                  </div>
                </div>
                <div className="IntListItemActions">
                  <button
                    className="IntBtnSync"
                    onClick={() => importLeads(int.id)}
                    disabled={importingId === int.id}
                    title="Import old leads from this form"
                  >
                    {importingId === int.id
                      ? <><Loader2 size={13} className="IntSpinner" /> Importing…</>
                      : <><Download size={13} /> Import Old</>}
                  </button>
                  <button
                    className="IntBtnToggle"
                    onClick={() => toggleStatus(int.id, int.status)}
                    disabled={togglingId === int.id}
                    title={int.status === "active" ? "Pause" : "Resume"}
                  >
                    {togglingId === int.id
                      ? <Loader2 size={13} className="IntSpinner" />
                      : int.status === "active"
                        ? <Pause size={13} />
                        : <Play size={13} />}
                  </button>
                  <button
                    className="IntBtnDelete"
                    onClick={() => deleteIntegration(int.id)}
                    disabled={deletingId === int.id}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View logs link */}
      {integrations.length > 0 && (
        <div className="IntLogsLink">
          <Link href="/dashboard/logs">View incoming leads log →</Link>
        </div>
      )}

      {/* Webhook info */}
      <div className="IntWebhookBox">
        <p className="IntWebhookBoxTitle">Webhook Endpoint</p>
        <div className="IntWebhookRow">
          <span className="IntWebhookMethod">GET / POST</span>
          <code className="IntWebhookUrl">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
        <div className="IntWebhookRow" style={{ marginTop: 8 }}>
          <span className="IntWebhookLabel">Verify Token:</span>
          <code className="IntWebhookToken">{verifyToken}</code>
          <CopyButton text={verifyToken} />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiFetch("/api/projects")
      .then((d) => setProjects(Array.isArray(d) ? (d as Project[]) : []))
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="DashTopBar">
        <div className="DashTopBarLeft">
          <span className="DashTopBarTitle">Integrations</span>
        </div>
      </header>
      <section className="PageShell IntPageShell">
        <div className="IntPageHeader">
          <div className="PageTag">Integrations</div>
          <h1 className="PageTitle" style={{ fontSize: 32 }}>Connect your lead sources</h1>
          <p className="PageLead" style={{ fontSize: 15 }}>
            Import leads from Google Sheets or receive them automatically from Meta Lead Ads.{" "}
            {projects.length === 0 && (
              <Link href="/dashboard/projects" style={{ color: "#ce050d" }}>Create a project</Link>
            )}{" "}
            {projects.length > 0 && (
              <Link href="/dashboard/projects" style={{ color: "#ce050d" }}>Manage projects →</Link>
            )}
          </p>
        </div>
        <div className="IntSections">
          <MetaSection projects={projects} />
          <SheetsSection projects={projects} />
        </div>
      </section>
    </>
  );
}
