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
  CalendarPlus,
  CheckCircle2,
  Pencil,
  RotateCcw,
  Store,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { TopBar } from "@/components/dashboard/TopBar";
import "@/styles/Pages.css";

const LEAD_REFRESH_INTERVAL_MS = 20000;
const LEAD_COUNT_POLL_INTERVAL_MS = 20000;
const META_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const VS_DISPLAY_LIMIT = 10;

const STATUS_ORDER = [
  "NEW",
  "ATTENDED",
  "NO_RESPONSE",
  "CALL_BACK",
  "INTERESTED",
  "FOLLOW_UP",
  "UNDECIDED",
  "VISITING_STORE",
  "VISITED",
  "WON",
  "LOST",
];

const DATE_FILTER_OPTIONS = [
  { value: "DEFAULT", label: "All leads" },
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LATEST_15_DAYS", label: "Latest 15 days" },
  { value: "ALL_TIME", label: "All Time" },
  { value: "CUSTOM", label: "Custom date range" },
];

type SortKey = "phone" | "requirements" | "enquiryEntry" | "status" | null;
type SortDir = "asc" | "desc";

function getStatusMeta(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "#60a5fa" },
    ATTENDED: { label: "Attended", color: "#2dd4bf" },
    NO_RESPONSE: { label: "No Response", color: "#f472b6" },
    NOT_ATTENTED: { label: "Not Attended", color: "#fca5a5" },
    "NOT ATTENTED": { label: "Not Attended", color: "#fca5a5" },
    CALL_BACK: { label: "Call Back", color: "#fb923c" },
    INTERESTED: { label: "Interested", color: "#4ade80" },
    INTRESTED: { label: "Interested", color: "#4ade80" },
    FOLLOW_UP: { label: "Follow Up", color: "#a78bfa" },
    UNDECIDED: { label: "Undecided", color: "#fbbf24" },
    VISITING_STORE: { label: "Visiting", color: "#818cf8" },
    VISING: { label: "Visiting", color: "#818cf8" },
    VISITED: { label: "Visited", color: "#c084fc" },
    WON: { label: "Won", color: "#34d399" },
    LOST: { label: "Not Interested", color: "#f87171" },
    NOT_INTRESTED: { label: "Not Interested", color: "#f87171" },
    "NOT INTRESTED": { label: "Not Interested", color: "#f87171" },
  };
  return map[s] ?? { label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " "), color: "#9ca3af" };
}

function getStatusStyle(s: string, updating: boolean): React.CSSProperties {
  if (updating)
    return {
      backgroundColor: "#f3f4f6",
      color: "#111827",
      border: "1px solid #d1d5db",
    };
  const map: Record<string, React.CSSProperties> = {
    NEW: {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    },
    NO_RESPONSE: {
      backgroundColor: "#fce7f3",
      color: "#9d174d",
      border: "1px solid #f9a8d4",
    },
    ATTENDED: {
      backgroundColor: "#ccfbf1",
      color: "#0f766e",
      border: "1px solid #5eead4",
    },
    CALL_BACK: {
      backgroundColor: "#ffedd5",
      color: "#c2410c",
      border: "1px solid #fdba74",
    },
    INTERESTED: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
    FOLLOW_UP: {
      backgroundColor: "#ede9fe",
      color: "#6d28d9",
      border: "1px solid #c4b5fd",
    },
    VISITING_STORE: {
      backgroundColor: "#e0e7ff",
      color: "#3730a3",
      border: "1px solid #a5b4fc",
    },
    VISING: {
      backgroundColor: "#e0e7ff",
      color: "#3730a3",
      border: "1px solid #a5b4fc",
    },
    VISITED: {
      backgroundColor: "#fdf4ff",
      color: "#7e22ce",
      border: "1px solid #d8b4fe",
    },
    WON: {
      backgroundColor: "#d1fae5",
      color: "#065f46",
      border: "1px solid #6ee7b7",
    },
    LOST: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fca5a5",
    },
    "NOT INTRESTED": {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fca5a5",
    },
    NOT_INTRESTED: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fca5a5",
    },
    INTRESTED: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
    UNDECIDED: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    },
    "NOT ATTENTED": {
      backgroundColor: "#ffe4e6",
      color: "#9f1239",
      border: "1px solid #fda4af",
    },
    NOT_ATTENTED: {
      backgroundColor: "#ffe4e6",
      color: "#9f1239",
      border: "1px solid #fda4af",
    },
  };
  return (
    map[s] ?? {
      backgroundColor: "#f3f4f6",
      color: "#374151",
      border: "1px solid #9ca3af",
    }
  );
}

interface Lead {
  id: number;
  phoneNumber?: string | null;
  requirements?: string | null;
  clientName?: string | null;
  enquiryEntry?: string | null;
  addedBy?: string | null;
  status?: string | null;
  visitingStoreDate?: string | null;
  link?: string | null;
  notes?: string | null;
  log?: string | null;
  source?: string | null;
  data?: Record<string, string> | null;
}

function parseLeadDate(lead: Lead): Date | null {
  const raw = lead.enquiryEntry;
  if (!raw) return null;
  // en-IN strings (d/m/y) must be parsed before `new Date(raw)` — otherwise
  // values like "1/7/2026" are read as US m/d/y (Jan 7 instead of Jul 1).
  const m = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i,
  );
  if (m) {
    const [, d, mo, y, h, min, sec = "0", mer] = m;
    let hr = Number(h);
    if (mer.toLowerCase() === "pm" && hr !== 12) hr += 12;
    if (mer.toLowerCase() === "am" && hr === 12) hr = 0;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      hr,
      Number(min),
      Number(sec),
    );
  }
  const iso = new Date(raw);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const result = startOfDay(d);
  result.setDate(result.getDate() + n);
  return result;
}

function parseDateInput(value?: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateInput(value?: string | null): string {
  const date = parseDateInput(value);
  if (!date) return "Date not set";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getVSDateTone(value?: string | null) {
  const date = parseDateInput(value);
  if (!date) return "blue";
  const visitTime = startOfDay(date).getTime();
  const todayTime = startOfDay(new Date()).getTime();
  if (visitTime < todayTime) return "overdue";
  return visitTime === todayTime ? "today" : "blue";
}

function isVSOutcomeReady(value?: string | null) {
  const date = parseDateInput(value);
  if (!date) return false;
  return startOfDay(date).getTime() <= startOfDay(new Date()).getTime();
}

function getLatestLogEntry(log?: string | null) {
  if (!log?.trim()) return "No status updates yet.";
  return log
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .at(-1) ?? "No status updates yet.";
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />;
  return sortDir === "asc" ? (
    <ChevronUp size={12} />
  ) : (
    <ChevronDown size={12} />
  );
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
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [enquiryButton, setEnquiryButton] = useState("Add Lead");

  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [assigningVisitLeadId, setAssigningVisitLeadId] = useState<number | null>(null);
  const [removingVisitLeadId, setRemovingVisitLeadId] = useState<number | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);
  const [visitDateDrafts, setVisitDateDrafts] = useState<Record<number, string>>({});
  const [showAllVSLeads, setShowAllVSLeads] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("DEFAULT");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [brandnames, setBrandnames] = useState<string[]>([]);
  const [brandsError, setBrandsError] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const localLeadCountRef = useRef<number | null>(null);

  useEffect(() => {
    apiFetch("/api/projects")
      .then((d) => setProjects(Array.isArray(d) ? (d as { id: string; name: string }[]) : []))
      .catch(() => {});
  }, []);

  const fetchLeads = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoadingLeads(true);
      else setIsRefreshing(true);
      try {
        const qs = projectFilter ? `?projectId=${projectFilter}` : "";
        const data = await apiFetch(`/api/leads${qs}`);
        setLeads(Array.isArray(data) ? (data as Lead[]) : []);
        setLoadError("");
        setLastUpdated(new Date());
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Unable to load leads right now.",
        );
      } finally {
        if (!silent) setLoadingLeads(false);
        else setIsRefreshing(false);
      }
    },
    [user, projectFilter],
  );

  useEffect(() => {
    if (!user) return;
    const initialLoad = window.setTimeout(() => fetchLeads(false), 0);
    const timer = setInterval(() => fetchLeads(true), LEAD_REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(timer);
    };
  }, [user, fetchLeads]);

  // Sync Meta leads immediately on open, then every 10 minutes
  useEffect(() => {
    if (!user) return;
    const syncMeta = () => fetch("/api/cron/sync-meta").catch(() => {});
    syncMeta();
    const timer = setInterval(syncMeta, META_SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!user || !isAgency) return;
    let cancelled = false;
    (async () => {
      try {
        const brands = (await apiFetch("/api/brands")) as string[];
        if (!cancelled) setBrandnames(Array.isArray(brands) ? brands : []);
      } catch (err) {
        if (!cancelled) {
          setBrandnames([]);
          setBrandsError(
            err instanceof ApiError
              ? err.message
              : "Unable to load client names.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
        if (
          localLeadCountRef.current !== null &&
          serverCount !== localLeadCountRef.current
        ) {
          fetchLeads(true);
        }
      } catch {
        /* silently ignore poll errors */
      }
    };
    const timer = setInterval(poll, LEAD_COUNT_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, fetchLeads]);

  const sortedLeads = useMemo(() => {
    const base = [...leads].sort((a, b) => {
      const da = parseLeadDate(a),
        db = parseLeadDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });
    if (!sortKey) return base;
    return [...base].sort((a, b) => {
      if (sortKey === "enquiryEntry") {
        const diff =
          (parseLeadDate(a)?.getTime() ?? 0) -
          (parseLeadDate(b)?.getTime() ?? 0);
        return sortDir === "asc" ? diff : -diff;
      }
      const av =
        (sortKey === "phone"
          ? a.phoneNumber
          : sortKey === "requirements"
            ? a.requirements
            : a.status) ?? "";
      const bv =
        (sortKey === "phone"
          ? b.phoneNumber
          : sortKey === "requirements"
            ? b.requirements
            : b.status) ?? "";
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir]);

  const filteredLeads = useMemo(() => {
    const now = new Date();
    const tod = startOfDay(now);
    const tom = addDays(now, 1);
    const yes = addDays(now, -1);
    const last7Start = addDays(now, -6);
    const last15Start = addDays(now, -14);
    let scoped = sortedLeads;
    switch (dateFilter) {
      case "TODAY":
        scoped = sortedLeads.filter((l) => {
          const d = parseLeadDate(l);
          return d && d >= tod && d < tom;
        });
        break;
      case "YESTERDAY":
        scoped = sortedLeads.filter((l) => {
          const d = parseLeadDate(l);
          return d && d >= yes && d < tod;
        });
        break;
      case "LAST_7_DAYS":
        scoped = sortedLeads.filter((l) => {
          const d = parseLeadDate(l);
          return d && d >= last7Start;
        });
        break;
      case "ALL_TIME":
      case "DEFAULT":
        scoped = sortedLeads;
        break;
      case "LATEST_15_DAYS":
        scoped = sortedLeads.filter((l) => {
          const d = parseLeadDate(l);
          return d && d >= last15Start;
        });
        break;
      case "CUSTOM": {
        const s = customStartDate
          ? new Date(`${customStartDate}T00:00:00`)
          : null;
        const e = customEndDate
          ? new Date(`${customEndDate}T23:59:59.999`)
          : null;
        scoped = sortedLeads.filter((l) => {
          const d = parseLeadDate(l);
          if (!d) return false;
          if (s && d < s) return false;
          if (e && d > e) return false;
          return true;
        });
        break;
      }
    }
    return statusFilter === "ALL"
      ? scoped
      : scoped.filter((l) => l.status === statusFilter);
  }, [sortedLeads, statusFilter, dateFilter, customStartDate, customEndDate]);

  const statusSummary = useMemo(() => {
    const counts = STATUS_ORDER.map((s) => ({
      status: s,
      count: filteredLeads.filter((l) => l.status === s).length,
      ...getStatusMeta(s),
    })).filter((i) => i.count > 0);
    return { total: filteredLeads.length, counts };
  }, [filteredLeads]);

  const statusCountMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of filteredLeads) {
      const s = l.status ?? "NEW";
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [filteredLeads]);

  const visitingStoreLeads = useMemo(() => {
    return leads
      .filter(
        (lead) =>
          Boolean(lead.visitingStoreDate) &&
          (lead.status || "VISITING_STORE") === "VISITING_STORE",
      )
      .sort((a, b) => {
        const ad = parseDateInput(a.visitingStoreDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bd = parseDateInput(b.visitingStoreDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
  }, [leads]);

  const visibleVisitingStoreLeads = useMemo(() => {
    if (showAllVSLeads) return visitingStoreLeads;

    const todayLeads = visitingStoreLeads.filter(
      (lead) => getVSDateTone(lead.visitingStoreDate) === "today",
    );
    const otherLeads = visitingStoreLeads.filter(
      (lead) => getVSDateTone(lead.visitingStoreDate) !== "today",
    );
    const remainingSlots = Math.max(VS_DISPLAY_LIMIT - todayLeads.length, 0);

    return [...todayLeads, ...otherLeads.slice(0, remainingSlots)];
  }, [showAllVSLeads, visitingStoreLeads]);

  const hasMoreVSLeads = visibleVisitingStoreLeads.length < visitingStoreLeads.length;

  const persistNotes = useCallback(async (leadId: number, notes: string) => {
    try {
      const updated = (await apiFetch("/api/notes", {
        method: "POST",
        body: { id: leadId, notes },
      })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  }, []);

  const updateStatus = async (leadId: number, newStatus: string) => {
    setUpdatingLeadId(leadId);
    try {
      const updated = (await apiFetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        body: { status: newStatus },
      })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setFormStatus({
        type: "error",
        msg: err instanceof ApiError ? err.message : "Unable to update status.",
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const markLeadAttendedFromContact = (lead: Lead) => {
    if ((lead.status || "NEW") !== "NEW") return;
    void updateStatus(lead.id, "ATTENDED");
  };

  const assignVisitingStore = async (lead: Lead) => {
    const visitingStoreDate = visitDateDrafts[lead.id] || lead.visitingStoreDate || "";
    if (!visitingStoreDate) {
      setFormStatus({
        type: "error",
        msg: "Select a visiting store date before adding the lead to VS.",
      });
      return;
    }

    setAssigningVisitLeadId(lead.id);
    try {
      const updated = (await apiFetch(`/api/leads/${lead.id}/visiting-store`, {
        method: "PUT",
        body: { visitingStoreDate },
      })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setVisitDateDrafts((prev) => ({
        ...prev,
        [updated.id]: updated.visitingStoreDate || visitingStoreDate,
      }));
      setFormStatus({
        type: "success",
        msg: "Lead added to the Visiting Store display.",
      });
    } catch (err) {
      setFormStatus({
        type: "error",
        msg:
          err instanceof ApiError
            ? err.message
            : "Unable to add the lead to the Visiting Store display.",
      });
    } finally {
      setAssigningVisitLeadId(null);
    }
  };

  const removeFromVisitingStore = async (lead: Lead) => {
    setRemovingVisitLeadId(lead.id);
    try {
      const updated = (await apiFetch(`/api/leads/${lead.id}/visiting-store`, {
        method: "DELETE",
      })) as Lead;
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setVisitDateDrafts((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
      setFormStatus({
        type: "success",
        msg: "Lead removed from the Visiting Store display.",
      });
    } catch (err) {
      setFormStatus({
        type: "error",
        msg:
          err instanceof ApiError
            ? err.message
            : "Unable to remove the lead from the Visiting Store display.",
      });
    } finally {
      setRemovingVisitLeadId(null);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);
    setEnquiryButton("Adding…");
    const selected = isAgency ? clientName || brandnames[0] : user?.brandName;
    if (!leadNumber.trim() || !requirement.trim()) {
      setFormStatus({
        type: "error",
        msg: "Lead number and requirement are required.",
      });
      setEnquiryButton("Add Lead");
      return;
    }
    const cleaned = leadNumber.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setFormStatus({
        type: "error",
        msg: "Lead number must contain at least 10 digits.",
      });
      setEnquiryButton("Add Lead");
      return;
    }
    if (isAgency && !selected) {
      setFormStatus({
        type: "error",
        msg: "Select a client before adding a lead.",
      });
      setEnquiryButton("Add Lead");
      return;
    }
    try {
      const saved = (await apiFetch("/api/leads", {
        method: "POST",
        body: {
          phoneNumber: leadNumber,
          requirements: requirement,
          clientName: selected,
          link: link || null,
          status: "NEW",
          enquiryEntry: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
        },
      })) as Lead;
      setLeads((prev) => [saved, ...prev]);
      setLeadNumber("");
      setLink("");
      setRequirement("");
      setClientName("");
      setFormStatus({ type: "success", msg: "Lead added successfully." });
    } catch (err) {
      setFormStatus({
        type: "error",
        msg:
          err instanceof ApiError
            ? err.message
            : "Unable to add the lead right now.",
      });
    } finally {
      setEnquiryButton("Add Lead");
    }
  };

  const deleteLead = async (leadId: number) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    setDeletingLeadId(leadId);
    try {
      await apiFetch(`/api/leads/${leadId}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      setFormStatus({
        type: "error",
        msg: err instanceof ApiError ? err.message : "Unable to delete lead.",
      });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const actionBtn = (bg: string) => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    background: bg,
    color: "#fff",
    textDecoration: "none",
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  });

  return (
    <>
      <TopBar
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchLeads(true)}
      />

      <section className="PageShell">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: "1rem",
            }}
          >
            <div className="PageHero">
              <p className="PageTag">Dashboard</p>
              <h2 style={{ fontWeight: 400, marginTop: 10, marginBottom: 10 }}>
                Hi {user?.name}
                {user?.brandName && (
                  <span style={{ fontSize: 15, opacity: 0.7 }}>
                    {" "}
                    (Team of {user.brandName})
                  </span>
                )}
              </h2>
              <h3 className="PageTitle" style={{ fontSize: "38px" }}>
                Lead Management Portal
              </h3>
              <p className="PageLead">
                {user?.name}, add lead entries and track requirements below.
              </p>
            </div>

            <div className="PageSection" style={{ flex: 1 }}>
              <h2 className="PageSectionTitle">Add Lead Requirement</h2>
              <div className="DashboardTopGrid">
                <form
                  className="SignInForm DashboardFormCard"
                  onSubmit={handleAddLead}
                >
                  <div className="Field">
                    <label htmlFor="leadNumber">Lead Number / Contact</label>
                    <input
                      id="leadNumber"
                      type="text"
                      placeholder="+91 9XXXXXXXXX"
                      value={leadNumber}
                      onChange={(e) =>
                        setLeadNumber(e.target.value.replace(/[^+\d\s]/g, ""))
                      }
                      required
                    />
                  </div>
                  <div className="Field">
                    <label htmlFor="requirement">Lead Requirement</label>
                    <input
                      id="requirement"
                      type="text"
                      placeholder="General Enquiry, Lenovo Loq…"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      required
                    />
                  </div>
                  <div className="Field">
                    <label htmlFor="link">Link (optional)</label>
                    <input
                      id="link"
                      type="text"
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>
                  {isAgency && (
                    <div className="Field">
                      <label htmlFor="clientSelect">Client Name</label>
                      <select
                        id="clientSelect"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      >
                        {brandnames.length === 0 && <option>Loading…</option>}
                        {brandnames.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      {brandsError && (
                        <p className="FieldError">{brandsError}</p>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="PrimaryBtn"
                    disabled={enquiryButton !== "Add Lead"}
                  >
                    {enquiryButton}
                  </button>
                  {formStatus && (
                    <p
                      className={`FormAlert FormAlert--${formStatus.type}`}
                      role={formStatus.type === "error" ? "alert" : "status"}
                    >
                      {formStatus.msg}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>

          <article
            className="InfoCard StatusGraphCard"
            style={{ display: "flex", flexDirection: "column", flex: 1 }}
          >
            <div className="StatusGraphHead">
              <div>
                <p className="PageTag">Filtered Snapshot</p>
                <h3>Status Overview</h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "#6b7280",
                  }}
                >
                  Built from the currently displayed leads.
                </p>
              </div>
            </div>
            <StatusChart
              counts={statusSummary.counts}
              total={statusSummary.total}
            />
          </article>
        </div>

        <div className="PageSection">
          <article className="InfoCard VSDisplayCard">
            <div className="VSDisplayHeader">
              <div>
                <p className="PageTag">VS Display</p>
                <h2 className="PageSectionTitle">Visiting Store Schedule</h2>
              </div>
              <span className="VSDisplayCount">
                <Store size={15} />
                {visitingStoreLeads.length}
              </span>
            </div>

            {visitingStoreLeads.length === 0 ? (
              <p className="VSDisplayEmpty">No leads assigned for a store visit yet.</p>
            ) : (
              <div className="VSDisplayList">
                {visibleVisitingStoreLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className={`VSDisplayItem VSDisplayItem--${getVSDateTone(lead.visitingStoreDate)}`}
                  >
                    <time className="VSDisplayDate">
                      {formatDateInput(lead.visitingStoreDate)}
                    </time>
                    <div className="VSDisplayDetails">
                      <strong>{lead.phoneNumber || "No number"}</strong>
                      <span>{lead.requirements || "No requirement added"}</span>
                      {isAgency && lead.clientName && <small>{lead.clientName}</small>}
                      <small className="VSDisplayLog">
                        Latest: {getLatestLogEntry(lead.log)}
                      </small>
                    </div>
                    <span className="VSDisplayStatus">
                      {getStatusMeta(lead.status || "VISITING_STORE").label}
                    </span>
                    {isVSOutcomeReady(lead.visitingStoreDate) && (
                      <div className="VSDisplayOutcome" aria-label="Due visiting store actions">
                        <button
                          type="button"
                          className="VSOutcomeBtn VSOutcomeBtn--won"
                          onClick={() => updateStatus(lead.id, "WON")}
                          disabled={updatingLeadId === lead.id}
                        >
                          <CheckCircle2 size={13} />
                          WON
                        </button>
                        <button
                          type="button"
                          className="VSOutcomeBtn VSOutcomeBtn--lost"
                          onClick={() => updateStatus(lead.id, "LOST")}
                          disabled={updatingLeadId === lead.id}
                        >
                          <XCircle size={13} />
                          Lost
                        </button>
                        <button
                          type="button"
                          className="VSOutcomeBtn VSOutcomeBtn--vs"
                          onClick={() => updateStatus(lead.id, "VISITING_STORE")}
                          disabled={updatingLeadId === lead.id}
                        >
                          <RotateCcw size={13} />
                          Not Yet
                        </button>
                      </div>
                    )}
                    <div className="VSDisplayEdit">
                      <input
                        type="date"
                        value={visitDateDrafts[lead.id] ?? lead.visitingStoreDate ?? ""}
                        onChange={(e) =>
                          setVisitDateDrafts((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                        aria-label={`Edit visiting store date for ${lead.phoneNumber}`}
                      />
                      <button
                        type="button"
                        className="VSLeadBtn"
                        onClick={() => assignVisitingStore(lead)}
                        disabled={assigningVisitLeadId === lead.id}
                        title="Update Visiting Store date"
                      >
                        <Pencil size={13} />
                        Update
                      </button>
                      <button
                        type="button"
                        className="VSRemoveBtn"
                        onClick={() => removeFromVisitingStore(lead)}
                        disabled={removingVisitLeadId === lead.id}
                        title="Remove from Visiting Store display"
                      >
                        <XCircle size={13} />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
                {hasMoreVSLeads && (
                  <button
                    type="button"
                    className="VSShowMoreBtn"
                    onClick={() => setShowAllVSLeads(true)}
                  >
                    Show more
                  </button>
                )}
              </div>
            )}
          </article>
        </div>

        <div className="PageSection">
          <div className="LeadEntriesHeader">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 className="PageSectionTitle">Lead Entries</h2>
            </div>
            <div className="LeadFiltersRow" style={{ marginBottom: 10 }}>
              <div className="LeadFilterWrap">
                <label htmlFor="status-filter">
                  <span className="LeadFilterLabel">
                    <SlidersHorizontal size={14} /> Filter by Status
                  </span>
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  {[
                    ...STATUS_ORDER,
                    ...Object.keys(statusCountMap).filter((s) => !STATUS_ORDER.includes(s)),
                  ].map((s) => (
                    <option key={s} value={s}>
                      {getStatusMeta(s).label}
                      {statusCountMap[s] ? ` (${statusCountMap[s]})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {projects.length > 0 && (
                <div className="LeadFilterWrap">
                  <label htmlFor="project-filter">
                    <span className="LeadFilterLabel">Project</span>
                  </label>
                  <select
                    id="project-filter"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                  >
                    <option value="">All projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="LeadFilterWrap">
                <label htmlFor="date-filter">
                  <span className="LeadFilterLabel">
                    <CalendarDays size={14} /> Filter by Date
                  </span>
                </label>
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {dateFilter === "CUSTOM" && (
                <div className="LeadFilterWrap LeadDateRangeWrap">
                  <label>
                    <span className="LeadFilterLabel">Custom Range</span>
                    <button
                      className={`LeadClearRangeSmallBtn${customStartDate || customEndDate ? "" : " LeadClearRangeSmallBtnHidden"}`}
                      onClick={() => {
                        setCustomStartDate("");
                        setCustomEndDate("");
                      }}
                      title="Clear date range"
                    >
                      <X size={12} />
                    </button>
                  </label>
                  <div className="LeadDateRangeInputs">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="LeadFilterWrap LeadMobileSortWrap">
                <label htmlFor="mobile-sort-filter">
                  <span className="LeadFilterLabel">
                    <ChevronsUpDown size={14} /> Sort Leads
                  </span>
                </label>
                <div className="LeadMobileSortControls">
                  <select
                    id="mobile-sort-filter"
                    value={sortKey ?? ""}
                    onChange={(e) => setSortKey((e.target.value || null) as SortKey)}
                  >
                    <option value="">Default</option>
                    <option value="phone">Lead Number</option>
                    <option value="requirements">Requirement</option>
                    <option value="enquiryEntry">Entry Time</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    type="button"
                    className="LeadSortDirBtn"
                    onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                    aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
                    title={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
                  >
                    {sortDir === "asc" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadingLeads && (
            <article
              className="InfoCard"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 120,
              }}
            >
              <div className="Spinner" />
            </article>
          )}
          {!loadingLeads && leads.length === 0 && (
            <article className="InfoCard">
              <p>{loadError || "No leads added yet."}</p>
            </article>
          )}
          {!loadingLeads && leads.length > 0 && filteredLeads.length === 0 && (
            <article className="InfoCard">
              <p>No leads found for the selected filters.</p>
            </article>
          )}

          {!loadingLeads && filteredLeads.length > 0 && (
            <>
              <div className="LeadTableScrollWrap">
                <div className="LeadTableWrap InfoCard">
                  <table className="LeadTable">
                    <thead>
                      <tr>
                        <th>
                          <button
                            className="LeadTableSortBtn"
                            onClick={() => handleSort("phone")}
                          >
                            Lead Number{" "}
                            <SortIcon
                              col="phone"
                              sortKey={sortKey}
                              sortDir={sortDir}
                            />
                          </button>
                        </th>
                        <th>
                          <button
                            className="LeadTableSortBtn"
                            onClick={() => handleSort("requirements")}
                          >
                            Requirement{" "}
                            <SortIcon
                              col="requirements"
                              sortKey={sortKey}
                              sortDir={sortDir}
                            />
                          </button>
                        </th>
                        <th>Source</th>
                        <th>Link</th>
                        {isAgency && <th>Brand</th>}
                        <th>Added By</th>
                        <th>
                          <button
                            className="LeadTableSortBtn"
                            onClick={() => handleSort("enquiryEntry")}
                          >
                            Entry Time{" "}
                            <SortIcon
                              col="enquiryEntry"
                              sortKey={sortKey}
                              sortDir={sortDir}
                            />
                          </button>
                        </th>
                        <th>Notes</th>
                        <th>Actions</th>
                        <th>
                          <button
                            className="LeadTableSortBtn"
                            onClick={() => handleSort("status")}
                          >
                            Status{" "}
                            <SortIcon
                              col="status"
                              sortKey={sortKey}
                              sortDir={sortDir}
                            />
                          </button>
                        </th>
                        <th>Log</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>{lead.phoneNumber}</td>
                          <td>
                            {lead.requirements || "—"}
                            {lead.data && Object.keys(lead.data).length > 0 && (
                              <details style={{ marginTop: 4 }}>
                                <summary style={{ fontSize: 11, color: "#6b7280", cursor: "pointer" }}>
                                  {Object.keys(lead.data).length} extra fields
                                </summary>
                                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {Object.entries(lead.data).map(([k, v]) => (
                                    <span key={k} style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
                                      <strong>{k}:</strong> {v || "—"}
                                    </span>
                                  ))}
                                </div>
                              </details>
                            )}
                          </td>
                          <td>
                            {lead.source === "meta" && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                Meta Ad
                              </span>
                            )}
                            {lead.source === "google_sheets" && (
                              <span style={{ fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                Google Sheet
                              </span>
                            )}
                            {(!lead.source || lead.source === "manual") && (
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>Manual</span>
                            )}
                          </td>
                          <td>
                            {lead.link ? (
                              <a
                                href={lead.link}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#055cce",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                Link <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span style={{ color: "#9ca3af" }}>—</span>
                            )}
                          </td>
                          {isAgency && <td>{lead.clientName}</td>}
                          <td>{lead.addedBy}</td>
                          <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                            {lead.enquiryEntry}
                          </td>
                          <td>
                            <textarea
                              placeholder="eg: call on Monday…"
                              value={lead.notes || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setLeads((prev) =>
                                  prev.map((l) =>
                                    l.id === lead.id ? { ...l, notes: v } : l,
                                  ),
                                );
                              }}
                              onBlur={(e) =>
                                persistNotes(lead.id, e.target.value)
                              }
                              style={{
                                width: 190,
                                minHeight: 58,
                                padding: 8,
                                borderRadius: 8,
                                border: "1px solid #d1d5db",
                                resize: "vertical",
                                fontFamily: "inherit",
                                fontSize: 13,
                              }}
                            />
                          </td>
                          <td>
                            <div className="LeadActionGroup">
                              <a
                                href={`tel:${(lead.phoneNumber || "").replace(/[^\d+]/g, "")}`}
                                aria-label={`Call ${lead.phoneNumber}`}
                                title="Call"
                                style={actionBtn("#111827")}
                                onClick={() => markLeadAttendedFromContact(lead)}
                              >
                                <Phone size={15} />
                              </a>
                              <a
                                href={`https://wa.me/${(lead.phoneNumber || "").replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`WhatsApp ${lead.phoneNumber}`}
                                title="WhatsApp"
                                style={actionBtn("#25D366")}
                                onClick={() => markLeadAttendedFromContact(lead)}
                              >
                                <FaWhatsapp />
                              </a>
                              <div className="VSLeadAction">
                                {lead.visitingStoreDate && (
                                  <span className="VSLeadExistingDate">
                                    VS: {formatDateInput(lead.visitingStoreDate)}
                                  </span>
                                )}
                                <input
                                  type="date"
                                  value={visitDateDrafts[lead.id] ?? lead.visitingStoreDate ?? ""}
                                  onChange={(e) =>
                                    setVisitDateDrafts((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.value,
                                    }))
                                  }
                                  title="Select visiting store date"
                                  aria-label={`Select visiting store date for ${lead.phoneNumber}`}
                                />
                                <button
                                  type="button"
                                  className="VSLeadBtn"
                                  onClick={() => assignVisitingStore(lead)}
                                  disabled={assigningVisitLeadId === lead.id}
                                  title="Add to Visiting Store display"
                                  aria-label={`Add ${lead.phoneNumber} to Visiting Store display`}
                                >
                                  <CalendarPlus size={13} />
                                  VS
                                </button>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="StatusSelectWrap">
                              <select
                                value={
                                  updatingLeadId === lead.id
                                    ? ""
                                    : lead.status || "NEW"
                                }
                                disabled={updatingLeadId === lead.id}
                                onChange={(e) =>
                                  updateStatus(lead.id, e.target.value)
                                }
                                style={{
                                  padding: "7px 10px 7px 10px",
                                  minWidth: 136,
                                  fontWeight: 600,
                                  fontSize: 13,
                                  cursor:
                                    updatingLeadId === lead.id
                                      ? "not-allowed"
                                      : "pointer",
                                  outline: "none",
                                  opacity: updatingLeadId === lead.id ? 0.7 : 1,
                                  ...getStatusStyle(
                                    lead.status || "NEW",
                                    updatingLeadId === lead.id,
                                  ),
                                }}
                              >
                                {updatingLeadId === lead.id ? (
                                  <option value="">Updating…</option>
                                ) : (
                                  [
                                    ...STATUS_ORDER,
                                    ...(lead.status && !STATUS_ORDER.includes(lead.status) ? [lead.status] : []),
                                  ].map((s) => (
                                    <option key={s} value={s}>
                                      {getStatusMeta(s).label}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          </td>
                          <td>
                            {lead.log ? (
                              <div className="LeadTimeline">
                                {lead.log
                                  .split("\n")
                                  .filter(Boolean)
                                  .map((entry, i) => {
                                    const match =
                                      entry.match(/^\[(.*?)\]\s*(.*)/);
                                    if (!match)
                                      return (
                                        <div
                                          key={i}
                                          className="LeadTimelineItem"
                                        >
                                          <span className="LeadTimelineText">
                                            {entry}
                                          </span>
                                        </div>
                                      );
                                    const [, timestamp, message] = match;
                                    return (
                                      <div key={i} className="LeadTimelineItem">
                                        <span className="LeadTimelineDot" />
                                        <div className="LeadTimelineContent">
                                          <span className="LeadTimelineTime">
                                            {timestamp}
                                          </span>
                                          <span className="LeadTimelineText">
                                            {message}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: 12 }}>
                                No status updates yet.
                              </span>
                            )}
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
                      <span className="LeadCardStatusText">
                        {getStatusMeta(lead.status || "NEW").label}
                      </span>
                    </div>
                    <p className="LeadCardReq">{lead.requirements}</p>
                    <div className="LeadCardRow">
                      <span className="LeadCardMeta">{lead.enquiryEntry}</span>
                      {isAgency && (
                        <span className="LeadCardMeta">{lead.clientName}</span>
                      )}
                    </div>
                    <div className="LeadCardRow">
                      <span className="LeadCardMeta">
                        Added by {lead.addedBy || "Unknown"}
                      </span>
                      {lead.link && (
                        <a
                          href={lead.link}
                          target="_blank"
                          rel="noreferrer"
                          className="LeadCardLink"
                        >
                          Link <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className="VSLeadAction LeadCardVSAction">
                      {lead.visitingStoreDate && (
                        <span className="VSLeadExistingDate">
                          VS: {formatDateInput(lead.visitingStoreDate)}
                        </span>
                      )}
                      <input
                        type="date"
                        value={visitDateDrafts[lead.id] ?? lead.visitingStoreDate ?? ""}
                        onChange={(e) =>
                          setVisitDateDrafts((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                        title="Select visiting store date"
                        aria-label={`Select visiting store date for ${lead.phoneNumber}`}
                      />
                      <button
                        type="button"
                        className="VSLeadBtn"
                        onClick={() => assignVisitingStore(lead)}
                        disabled={assigningVisitLeadId === lead.id}
                        title="Add to Visiting Store display"
                        aria-label={`Add ${lead.phoneNumber} to Visiting Store display`}
                      >
                        <CalendarPlus size={13} />
                        VS
                      </button>
                    </div>
                    <div className="StatusSelectWrap">
                      <select
                        value={
                          updatingLeadId === lead.id ? "" : lead.status || "NEW"
                        }
                        disabled={updatingLeadId === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        style={{
                          padding: "7px 10px 7px 10px",
                          fontWeight: 600,
                          fontSize: 13,
                          ...getStatusStyle(
                            lead.status || "NEW",
                            updatingLeadId === lead.id,
                          ),
                        }}
                      >
                        {updatingLeadId === lead.id ? (
                          <option value="">Updating…</option>
                        ) : (
                          [
                            ...STATUS_ORDER,
                            ...(lead.status && !STATUS_ORDER.includes(lead.status) ? [lead.status] : []),
                          ].map((s) => (
                            <option key={s} value={s}>
                              {getStatusMeta(s).label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <textarea
                      className="LeadCardNotes"
                      placeholder="eg: call on Monday…"
                      value={lead.notes || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLeads((prev) =>
                          prev.map((l) =>
                            l.id === lead.id ? { ...l, notes: v } : l,
                          ),
                        );
                      }}
                      onBlur={(e) => persistNotes(lead.id, e.target.value)}
                    />
                    {lead.log && (
                      <div className="LeadCardLog">
                        <div className="LeadTimeline">
                          {lead.log
                            .split("\n")
                            .filter(Boolean)
                            .map((entry, i) => {
                              const match = entry.match(/^\[(.*?)\]\s*(.*)/);
                              if (!match)
                                return (
                                  <div key={i} className="LeadTimelineItem">
                                    {entry}
                                  </div>
                                );
                              const [, timestamp, message] = match;
                              return (
                                <div key={i} className="LeadTimelineItem">
                                  <span className="LeadTimelineDot" />
                                  <div className="LeadTimelineContent">
                                    <span className="LeadTimelineTime">
                                      {timestamp}
                                    </span>
                                    <span className="LeadTimelineText">
                                      {message}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    <div className="LeadCardBottomActions">
                      <a
                        href={`tel:${(lead.phoneNumber || "").replace(/[^\d+]/g, "")}`}
                        title="Call"
                        style={actionBtn("#111827")}
                        onClick={() => markLeadAttendedFromContact(lead)}
                      >
                        <Phone size={15} />
                      </a>
                      <a
                        href={`https://wa.me/${(lead.phoneNumber || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                        style={actionBtn("#25D366")}
                        onClick={() => markLeadAttendedFromContact(lead)}
                      >
                        <FaWhatsapp />
                      </a>
                      <button
                        className="LeadDeleteBtn"
                        onClick={() => deleteLead(lead.id)}
                        disabled={deletingLeadId === lead.id}
                        aria-label="Delete lead"
                        title="Delete lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
