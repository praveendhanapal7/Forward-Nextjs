"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal,
  CalendarDays,
  Phone,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { TopBar } from "@/components/dashboard/TopBar";
import "@/styles/Pages.css";

const LEAD_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LEAD_COUNT_POLL_INTERVAL_MS = 60 * 1000;

const STATUS_ORDER = [
  "NEW", "ATTENDED", "NO_RESPONSE", "CALL_BACK",
  "INTERESTED", "FOLLOW_UP", "WON", "LOST",
];

const DATE_FILTER_OPTIONS = [
  { value: "DEFAULT", label: "Recent First" },
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "ALL_TIME", label: "All Time" },
  { value: "CUSTOM", label: "Custom date range" },
];

type SortKey = "phone" | "requirements" | "enquiryEntry" | "status" | null;
type SortDir = "asc" | "desc";

function getStatusMeta(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "#0ea5e9" },
    ATTENDED: { label: "Attended", color: "#14b8a6" },
    NO_RESPONSE: { label: "No Response", color: "#ef4444" },
    CALL_BACK: { label: "Call Back", color: "#eab308" },
    INTERESTED: { label: "Interested", color: "#22c55e" },
    FOLLOW_UP: { label: "Follow Up", color: "#8b5cf6" },
    WON: { label: "Won", color: "#06b6d4" },
    LOST: { label: "Lost", color: "#64748b" },
  };
  return map[s] ?? { label: "New", color: "#0ea5e9" };
}

function getStatusStyle(s: string, updating: boolean): React.CSSProperties {
  if (updating) return { backgroundColor: "#f3f4f6", color: "#111827", border: "1px solid #d1d5db" };
  const map: Record<string, React.CSSProperties> = {
    NEW: { backgroundColor: "#e0f2fe", color: "#075985", border: "1px solid #7dd3fc" },
    NO_RESPONSE: { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
    ATTENDED: { backgroundColor: "#ccfbf1", color: "#0f766e", border: "1px solid #5eead4" },
    CALL_BACK: { backgroundColor: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" },
    INTERESTED: { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
    FOLLOW_UP: { backgroundColor: "#ede9fe", color: "#6d28d9", border: "1px solid #c4b5fd" },
    WON: { backgroundColor: "#cffafe", color: "#155e75", border: "1px solid #67e8f9" },
    LOST: { backgroundColor: "#e2e8f0", color: "#334155", border: "1px solid #94a3b8" },
  };
  return map[s] ?? { backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" };
}

interface Lead {
  id: number;
  phoneNumber?: string | null;
  requirements?: string | null;
  clientName?: string | null;
  enquiryEntry?: string | null;
  addedBy?: string | null;
  status?: string | null;
  link?: string | null;
  notes?: string | null;
  log?: string | null;
}

function parseLeadDate(lead: Lead): Date | null {
  const raw = lead.enquiryEntry;
  if (!raw) return null;
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) return iso;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m) {
    const [, d, mo, y, h, min, sec = "0", mer] = m;
    let hr = Number(h);
    if (mer.toLowerCase() === "pm" && hr !== 12) hr += 12;
    if (mer.toLowerCase() === "am" && hr === 12) hr = 0;
    return new Date(Number(y), Number(mo) - 1, Number(d), hr, Number(min), Number(sec));
  }
  return null;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />;
  return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export default function DashboardPage() {
  const { user, isAgency } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");

  const [leadNumber, setLeadNumber] = useState("");
  const [link, setLink] = useState("");
  const [requirement, setRequirement] = useState("");
  const [clientName, setClientName] = useState("");
  const [formStatus, setFormStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [enquiryButton, setEnquiryButton] = useState("Add Lead");

  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("DEFAULT");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [brandnames, setBrandnames] = useState<string[]>([]);
  const [brandsError, setBrandsError] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const hasInitializedDateFilter = useRef(false);
  const localLeadCountRef = useRef<number | null>(null);

  const fetchLeads = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingLeads(true);
    else setIsRefreshing(true);
    try {
      const data = await apiFetch("/api/leads");
      setLeads(Array.isArray(data) ? (data as Lead[]) : []);
      setLoadError("");
      setLastUpdated(new Date());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Unable to load leads right now.");
    } finally {
      if (!silent) setLoadingLeads(false);
      else setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setLeads([]); setLoadingLeads(false); return; }
    fetchLeads(false);
    const timer = setInterval(() => fetchLeads(true), LEAD_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, fetchLeads]);

  useEffect(() => {
    if (hasInitializedDateFilter.current || leads.length === 0) return;
    const now = new Date();
    const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const hasToday = leads.some((l) => { const d = parseLeadDate(l); return d && d >= tod && d < tom; });
    setDateFilter(hasToday ? "TODAY" : "DEFAULT");
    hasInitializedDateFilter.current = true;
  }, [leads]);

  useEffect(() => {
    if (!user || !isAgency) return;
    let cancelled = false;
    (async () => {
      try {
        const brands = (await apiFetch("/api/brands")) as string[];
        if (!cancelled) setBrandnames(Array.isArray(brands) ? brands : []);
      } catch (err) {
        if (!cancelled) { setBrandnames([]); setBrandsError(err instanceof ApiError ? err.message : "Unable to load client names."); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, isAgency]);

  useEffect(() => {
    localLeadCountRef.current = leads.length;
  }, [leads]);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const data = await apiFetch("/api/leads/count");
        const serverCount = (data as { count: number }).count;
        if (localLeadCountRef.current !== null && serverCount !== localLeadCountRef.current) {
          fetchLeads(true);
        }
      } catch { /* silently ignore poll errors */ }
    };
    const timer = setInterval(poll, LEAD_COUNT_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, fetchLeads]);

  const sortedLeads = useMemo(() => {
    const base = [...leads].sort((a, b) => {
      const da = parseLeadDate(a), db = parseLeadDate(b);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return db.getTime() - da.getTime();
    });
    if (!sortKey) return base;
    return [...base].sort((a, b) => {
      if (sortKey === "enquiryEntry") {
        const diff = (parseLeadDate(a)?.getTime() ?? 0) - (parseLeadDate(b)?.getTime() ?? 0);
        return sortDir === "asc" ? diff : -diff;
      }
      const av = (sortKey === "phone" ? a.phoneNumber : sortKey === "requirements" ? a.requirements : a.status) ?? "";
      const bv = (sortKey === "phone" ? b.phoneNumber : sortKey === "requirements" ? b.requirements : b.status) ?? "";
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir]);

  const filteredLeads = useMemo(() => {
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
    const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const yes = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    let scoped = sortedLeads;
    switch (dateFilter) {
      case "TODAY": scoped = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= tod && d < tom; }); break;
      case "YESTERDAY": scoped = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= yes && d < tod; }); break;
      case "LAST_7_DAYS": scoped = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= daysAgo(7); }); break;
      case "ALL_TIME": scoped = sortedLeads; break;
      case "CUSTOM": {
        const s = customStartDate ? new Date(`${customStartDate}T00:00:00`) : null;
        const e = customEndDate ? new Date(`${customEndDate}T23:59:59`) : null;
        scoped = sortedLeads.filter((l) => { const d = parseLeadDate(l); if (!d) return false; if (s && d < s) return false; if (e && d > e) return false; return true; });
        break;
      }
      default: {
        const today = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= tod && d < tom; });
        if (today.length > 0) { scoped = today; break; }
        const recent = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= daysAgo(2); });
        if (recent.length > 0) { scoped = recent; break; }
        const fallback = sortedLeads.filter((l) => { const d = parseLeadDate(l); return d && d >= daysAgo(15); });
        scoped = fallback.length > 0 ? fallback : sortedLeads;
      }
    }
    return statusFilter === "ALL" ? scoped : scoped.filter((l) => l.status === statusFilter);
  }, [sortedLeads, statusFilter, dateFilter, customStartDate, customEndDate]);

  const statusSummary = useMemo(() => {
    const counts = STATUS_ORDER.map((s) => ({
      status: s, count: filteredLeads.filter((l) => l.status === s).length, ...getStatusMeta(s),
    })).filter((i) => i.count > 0);
    return { total: filteredLeads.length, counts };
  }, [filteredLeads]);

  const statusCountMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of filteredLeads) { const s = l.status ?? "NEW"; m[s] = (m[s] ?? 0) + 1; }
    return m;
  }, [filteredLeads]);

  const persistNotes = useCallback(async (leadId: number, notes: string) => {
    try {
      const updated = (await apiFetch("/api/notes", { method: "POST", body: { id: leadId, notes } })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) { console.error("Failed to save notes:", err); }
  }, []);

  const updateStatus = async (leadId: number, newStatus: string) => {
    setUpdatingLeadId(leadId);
    try {
      const updated = (await apiFetch(`/api/leads/${leadId}/status`, { method: "PUT", body: { status: newStatus } })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setFormStatus({ type: "error", msg: err instanceof ApiError ? err.message : "Unable to update status." });
    } finally { setUpdatingLeadId(null); }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);
    setEnquiryButton("Adding…");
    const selected = isAgency ? clientName || brandnames[0] : user?.brandName;
    if (!leadNumber.trim() || !requirement.trim()) {
      setFormStatus({ type: "error", msg: "Lead number and requirement are required." });
      setEnquiryButton("Add Lead"); return;
    }
    if (isAgency && !selected) {
      setFormStatus({ type: "error", msg: "Select a client before adding a lead." });
      setEnquiryButton("Add Lead"); return;
    }
    try {
      const saved = (await apiFetch("/api/leads", {
        method: "POST",
        body: { phoneNumber: leadNumber, requirements: requirement, clientName: selected, link: link || null, status: "NEW", enquiryEntry: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
      })) as Lead;
      setLeads((prev) => [saved, ...prev]);
      setLeadNumber(""); setLink(""); setRequirement(""); setClientName("");
      setFormStatus({ type: "success", msg: "Lead added successfully." });
    } catch (err) {
      setFormStatus({ type: "error", msg: err instanceof ApiError ? err.message : "Unable to add the lead right now." });
    } finally { setEnquiryButton("Add Lead"); }
  };

  const deleteLead = async (leadId: number) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    setDeletingLeadId(leadId);
    try {
      await apiFetch(`/api/leads/${leadId}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      setFormStatus({ type: "error", msg: err instanceof ApiError ? err.message : "Unable to delete lead." });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const actionBtn = (bg: string) => ({
    width: 36, height: 36, borderRadius: 10, background: bg, color: "#fff",
    textDecoration: "none", display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const,
  });

  return (
    <>
      <TopBar
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchLeads(true)}
      />

      <section className="PageShell">
        <div className="PageHero">
          <p className="PageTag">Dashboard</p>
          <h2 style={{ fontWeight: 400, marginTop: 10, marginBottom: 10 }}>
            Hi {user?.name}
            {user?.brandName && <span style={{ fontSize: 15, opacity: 0.7 }}> (Team of {user.brandName})</span>}
          </h2>
          <h1 className="PageTitle">Lead Management Portal</h1>
          <p className="PageLead">{user?.name}, add lead entries and track requirements below.</p>
        </div>

        <div className="PageSection">
          <h2 className="PageSectionTitle">Add Lead Requirement</h2>
          <div className="DashboardTopGrid">
            <form className="SignInForm DashboardFormCard" onSubmit={handleAddLead}>
              <div className="Field">
                <label htmlFor="leadNumber">Lead Number / Contact</label>
                <input id="leadNumber" type="text" placeholder="+91 9XXXXXXXXX" value={leadNumber} onChange={(e) => setLeadNumber(e.target.value)} required />
              </div>
              <div className="Field">
                <label htmlFor="requirement">Lead Requirement</label>
                <input id="requirement" type="text" placeholder="General Enquiry, Lenovo Loq…" value={requirement} onChange={(e) => setRequirement(e.target.value)} required />
              </div>
              <div className="Field">
                <label htmlFor="link">Link (optional)</label>
                <input id="link" type="text" placeholder="https://example.com" value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
              {isAgency && (
                <div className="Field">
                  <label htmlFor="clientSelect">Client Name</label>
                  <select id="clientSelect" value={clientName} onChange={(e) => setClientName(e.target.value)}>
                    {brandnames.length === 0 && <option>Loading…</option>}
                    {brandnames.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {brandsError && <p className="FieldError">{brandsError}</p>}
                </div>
              )}
              <button type="submit" className="PrimaryBtn" disabled={enquiryButton !== "Add Lead"}>
                {enquiryButton}
              </button>
              {formStatus && (
                <p className={`FormAlert FormAlert--${formStatus.type}`} role={formStatus.type === "error" ? "alert" : "status"}>
                  {formStatus.msg}
                </p>
              )}
            </form>

            <article className="InfoCard StatusGraphCard">
              <div className="StatusGraphHead">
                <div>
                  <p className="PageTag">Filtered Snapshot</p>
                  <h3>Status Overview</h3>
                  <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "#6b7280" }}>
                    Built from the currently displayed leads.
                  </p>
                </div>
              </div>
              <StatusChart counts={statusSummary.counts} total={statusSummary.total} />
            </article>
          </div>
        </div>

        <div className="PageSection">
          <div className="LeadEntriesHeader">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 className="PageSectionTitle">Lead Entries</h2>
              {(statusFilter !== "ALL" || dateFilter !== "ALL_TIME") && (
                <button className="ShowAllBtn" onClick={() => { setStatusFilter("ALL"); setDateFilter("ALL_TIME"); }}>
                  Show All
                </button>
              )}
            </div>
            <div className="LeadFiltersRow" style={{ marginBottom: 10 }}>
              <div className="LeadFilterWrap">
                <label htmlFor="status-filter">
                  <span className="LeadFilterLabel"><SlidersHorizontal size={14} /> Filter by Status</span>
                </label>
                <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {getStatusMeta(s).label}{statusCountMap[s] ? ` (${statusCountMap[s]})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="LeadFilterWrap">
                <label htmlFor="date-filter">
                  <span className="LeadFilterLabel"><CalendarDays size={14} /> Filter by Date</span>
                </label>
                <select id="date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  {DATE_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {dateFilter === "CUSTOM" && (
                <div className="LeadFilterWrap LeadDateRangeWrap">
                  <label><span className="LeadFilterLabel">Custom Range</span></label>
                  <div className="LeadDateRangeInputs">
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {loadingLeads && (
            <article className="InfoCard" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
              <div className="Spinner" />
            </article>
          )}
          {!loadingLeads && leads.length === 0 && (
            <article className="InfoCard"><p>{loadError || "No leads added yet."}</p></article>
          )}
          {!loadingLeads && leads.length > 0 && filteredLeads.length === 0 && (
            <article className="InfoCard"><p>No leads found for the selected filters.</p></article>
          )}

          {!loadingLeads && filteredLeads.length > 0 && (
            <>
              <div className="LeadTableScrollWrap">
                <div className="LeadTableWrap InfoCard">
                  <table className="LeadTable">
                    <thead>
                      <tr>
                        <th><button className="LeadTableSortBtn" onClick={() => handleSort("phone")}>Lead Number <SortIcon col="phone" sortKey={sortKey} sortDir={sortDir} /></button></th>
                        <th><button className="LeadTableSortBtn" onClick={() => handleSort("requirements")}>Requirement <SortIcon col="requirements" sortKey={sortKey} sortDir={sortDir} /></button></th>
                        <th>Link</th>
                        {isAgency && <th>Brand</th>}
                        <th>Added By</th>
                        <th><button className="LeadTableSortBtn" onClick={() => handleSort("enquiryEntry")}>Entry Time <SortIcon col="enquiryEntry" sortKey={sortKey} sortDir={sortDir} /></button></th>
                        <th>Notes</th>
                        <th>Actions</th>
                        <th><button className="LeadTableSortBtn" onClick={() => handleSort("status")}>Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} /></button></th>
                        <th>Log</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>{lead.phoneNumber}</td>
                          <td>{lead.requirements}</td>
                          <td>
                            {lead.link
                              ? <a href={lead.link} target="_blank" rel="noreferrer" style={{ color: "#055cce", display: "inline-flex", alignItems: "center", gap: 4 }}>Link <ExternalLink size={12} /></a>
                              : <span style={{ color: "#9ca3af" }}>—</span>}
                          </td>
                          {isAgency && <td>{lead.clientName}</td>}
                          <td>{lead.addedBy}</td>
                          <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{lead.enquiryEntry}</td>
                          <td>
                            <textarea
                              placeholder="eg: call on Monday…"
                              value={lead.notes || ""}
                              onChange={(e) => { const v = e.target.value; setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, notes: v } : l)); }}
                              onBlur={(e) => persistNotes(lead.id, e.target.value)}
                              style={{ width: 190, minHeight: 58, padding: 8, borderRadius: 8, border: "1px solid #d1d5db", resize: "vertical", fontFamily: "inherit", fontSize: 13 }}
                            />
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <a href={`tel:${(lead.phoneNumber || "").replace(/[^\d+]/g, "")}`} aria-label={`Call ${lead.phoneNumber}`} title="Call" style={actionBtn("#111827")}><Phone size={15} /></a>
                              <a href={`https://wa.me/${(lead.phoneNumber || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${lead.phoneNumber}`} title="WhatsApp" style={actionBtn("#25D366")}><FaWhatsapp /></a>
                            </div>
                          </td>
                          <td>
                            <div className="StatusSelectWrap">
                              <select
                                value={updatingLeadId === lead.id ? "" : lead.status || "NEW"}
                                disabled={updatingLeadId === lead.id}
                                onChange={(e) => updateStatus(lead.id, e.target.value)}
                                style={{ padding: "7px 10px 7px 10px", minWidth: 136, fontWeight: 600, fontSize: 13, cursor: updatingLeadId === lead.id ? "not-allowed" : "pointer", outline: "none", opacity: updatingLeadId === lead.id ? 0.7 : 1, ...getStatusStyle(lead.status || "NEW", updatingLeadId === lead.id) }}
                              >
                                {updatingLeadId === lead.id ? <option value="">Updating…</option> : STATUS_ORDER.map((s) => <option key={s} value={s}>{getStatusMeta(s).label}</option>)}
                              </select>
                            </div>
                          </td>
                          <td>
                            <div style={{ minWidth: 200, maxWidth: 240, whiteSpace: "pre-wrap", lineHeight: 1.45, fontSize: 12, color: "#4b5563" }}>
                              {lead.log || "No status updates yet."}
                            </div>
                          </td>
                          <td>
                            <button
                              className="LeadDeleteBtn"
                              onClick={() => deleteLead(lead.id)}
                              disabled={deletingLeadId === lead.id}
                              aria-label="Delete lead"
                              title="Delete lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="LeadCardList">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="LeadCard">
                    <div className="LeadCardRow">
                      <span className="LeadCardPhone">{lead.phoneNumber}</span>
                      <div className="LeadCardActions">
                        <a href={`tel:${(lead.phoneNumber || "").replace(/[^\d+]/g, "")}`} title="Call" style={actionBtn("#111827")}><Phone size={15} /></a>
                        <a href={`https://wa.me/${(lead.phoneNumber || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" title="WhatsApp" style={actionBtn("#25D366")}><FaWhatsapp /></a>
                      </div>
                    </div>
                    <p className="LeadCardReq">{lead.requirements}</p>
                    <div className="LeadCardRow">
                      <span className="LeadCardMeta">{lead.enquiryEntry}</span>
                      {isAgency && <span className="LeadCardMeta">{lead.clientName}</span>}
                    </div>
                    <div className="StatusSelectWrap">
                      <select
                        value={updatingLeadId === lead.id ? "" : lead.status || "NEW"}
                        disabled={updatingLeadId === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        style={{ padding: "7px 10px 7px 10px", fontWeight: 600, fontSize: 13, ...getStatusStyle(lead.status || "NEW", updatingLeadId === lead.id) }}
                      >
                        {updatingLeadId === lead.id ? <option value="">Updating…</option> : STATUS_ORDER.map((s) => <option key={s} value={s}>{getStatusMeta(s).label}</option>)}
                      </select>
                    </div>
                    <textarea
                      className="LeadCardNotes"
                      placeholder="eg: call on Monday…"
                      value={lead.notes || ""}
                      onChange={(e) => { const v = e.target.value; setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, notes: v } : l)); }}
                      onBlur={(e) => persistNotes(lead.id, e.target.value)}
                    />
                    {lead.log && <div className="LeadCardLog">{lead.log}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
