"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowBigLeftDashIcon,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import "@/styles/Pages.css";
import "@/styles/Logs.css";

interface LogEntry {
  id: string;
  leadgenId: string | null;
  formId: string | null;
  formName: string | null;
  source: string | null;
  status: string;
  failureReason: string | null;
  retryCount: number;
  createdAt: string;
  integration?: {
    name: string;
    pageName: string;
    formName: string;
  } | null;
}

interface MetaIntegration {
  id: string;
  name: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCESS") return <CheckCircle2 size={15} className="LogStatusIconSuccess" />;
  if (status === "FAILED") return <XCircle size={15} className="LogStatusIconFailed" />;
  return <Clock size={15} className="LogStatusIconPending" />;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterIntegration, setFilterIntegration] = useState("");
  const [integrations, setIntegrations] = useState<MetaIntegration[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryResults, setRetryResults] = useState<Record<string, boolean>>({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterIntegration) params.set("integrationId", filterIntegration);
      params.set("limit", "100");
      const data = await apiFetch(`/api/meta/logs?${params}`) as { logs: LogEntry[]; total: number };
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [filterStatus, filterIntegration]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    apiFetch("/api/meta/integrations")
      .then((d) => setIntegrations(Array.isArray(d) ? (d as MetaIntegration[]) : []))
      .catch(() => {});
  }, []);

  const retryLog = async (id: string) => {
    setRetryingId(id);
    try {
      const result = await apiFetch(`/api/meta/logs/${id}/retry`, { method: "POST" }) as { success: boolean };
      setRetryResults((p) => ({ ...p, [id]: result.success }));
      if (result.success) fetchLogs();
    } catch { /* noop */ }
    finally { setRetryingId(null); }
  };

  const successCount = logs.filter((l) => l.status === "SUCCESS").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const pendingCount = logs.filter((l) => l.status === "PENDING").length;

  return (
    <>
      <header className="DashTopBar">
        <div className="DashTopBarLeft">
          <Link href="/dashboard/integrations" className="DashTopBarBackLink">
            <ArrowBigLeftDashIcon size={14} />
            <span>Integrations</span>
          </Link>
          <span className="DashTopBarTitle">Incoming Leads Log</span>
        </div>
        <button className="LogRefreshBtn" onClick={fetchLogs} disabled={loading}>
          {loading ? <Loader2 size={14} className="LogSpinner" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </header>
      <section className="PageShell LogPageShell">
        {/* Stats row */}
        <div className="LogStats">
          <div className="LogStat LogStatTotal">
            <span className="LogStatVal">{total}</span>
            <span className="LogStatLabel">Total Events</span>
          </div>
          <div className="LogStat LogStatSuccess">
            <span className="LogStatVal">{successCount}</span>
            <span className="LogStatLabel">Successful</span>
          </div>
          <div className="LogStat LogStatFailed">
            <span className="LogStatVal">{failedCount}</span>
            <span className="LogStatLabel">Failed</span>
          </div>
          <div className="LogStat LogStatPending">
            <span className="LogStatVal">{pendingCount}</span>
            <span className="LogStatLabel">Pending</span>
          </div>
        </div>

        {/* Filters */}
        <div className="LogFilters">
          <div className="LogFilterTabs">
            {["ALL", "SUCCESS", "FAILED", "PENDING"].map((s) => (
              <button
                key={s}
                className={`LogFilterTab ${filterStatus === s ? "LogFilterTabActive" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {integrations.length > 0 && (
            <select
              className="LogIntSelect"
              value={filterIntegration}
              onChange={(e) => setFilterIntegration(e.target.value)}
            >
              <option value="">All integrations</option>
              {integrations.map((int) => (
                <option key={int.id} value={int.id}>{int.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="LogCard">
          {loading ? (
            <div className="LogEmpty"><Loader2 size={18} className="LogSpinner" /> Loading…</div>
          ) : logs.length === 0 ? (
            <div className="LogEmpty">
              <Clock size={28} style={{ opacity: 0.3 }} />
              <p>No log entries yet. Leads received via webhook will appear here.</p>
            </div>
          ) : (
            <div className="LogTable">
              <div className="LogTableHead">
                <span>Time</span>
                <span>Integration</span>
                <span>Lead ID</span>
                <span>Status</span>
                <span>Failure Reason</span>
                <span></span>
              </div>
              {logs.map((log) => (
                <div className="LogTableRow" key={log.id}>
                  <span className="LogTime">{timeAgo(log.createdAt)}</span>
                  <span className="LogIntName">
                    {log.integration?.name ?? log.formName ?? log.formId ?? "—"}
                  </span>
                  <span className="LogLeadId">
                    {log.leadgenId ? (
                      <code>{log.leadgenId.slice(0, 12)}…</code>
                    ) : "—"}
                  </span>
                  <span className="LogStatusCell">
                    <StatusIcon status={log.status} />
                    <span className={`LogStatusText LogStatus${log.status}`}>
                      {log.status.charAt(0) + log.status.slice(1).toLowerCase()}
                    </span>
                  </span>
                  <span className="LogFailReason">
                    {log.failureReason ? (
                      <span title={log.failureReason}>
                        {log.failureReason.length > 50
                          ? log.failureReason.slice(0, 50) + "…"
                          : log.failureReason}
                      </span>
                    ) : "—"}
                  </span>
                  <span className="LogActions">
                    {log.status === "FAILED" && log.integration && (
                      <button
                        className="LogRetryBtn"
                        onClick={() => retryLog(log.id)}
                        disabled={retryingId === log.id || retryResults[log.id] === true}
                      >
                        {retryingId === log.id
                          ? <><Loader2 size={12} className="LogSpinner" /> Retrying…</>
                          : retryResults[log.id]
                            ? "✓ Retried"
                            : <><RefreshCw size={12} /> Retry</>}
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
