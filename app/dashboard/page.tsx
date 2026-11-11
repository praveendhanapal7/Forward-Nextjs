"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  Link2,
  CheckCircle2,
  Clock,
  PhoneCall,
  ArrowRight,
  Zap,
  Sheet,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { apiFetch } from "@/lib/api";
import "@/styles/Pages.css";
import "@/styles/Overview.css";

interface Lead {
  id: number;
  phoneNumber?: string | null;
  requirements?: string | null;
  clientName?: string | null;
  enquiryEntry?: string | null;
  status?: string | null;
  source?: string | null;
}

interface LeadSource {
  id: string;
  type: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#60a5fa",
  ATTENDED: "#22d3ee",
  INTERESTED: "#facc15",
  FOLLOW_UP: "#a78bfa",
  CALL_BACK: "#fb923c",
  NO_RESPONSE: "#f472b6",
  VISITING_STORE: "#ef4444",
  WON: "#4ade80",
  LOST: "#94a3b8",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="OVStatCard" style={{ borderColor: color + "33" }}>
      <div className="OVStatIcon" style={{ background: color + "18", color }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="OVStatInfo">
        <span className="OVStatValue">{value}</span>
        <span className="OVStatLabel">{label}</span>
      </div>
      {href && <ArrowRight size={14} className="OVStatArrow" />}
    </div>
  );
  return href ? (
    <Link href={href} className="OVStatCardLink">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sheets, setSheets] = useState<LeadSource[]>([]);
  const [metaSources, setMetaSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [leadsData, sheetsData, metaData] = await Promise.all([
        apiFetch("/api/leads") as Promise<Lead[]>,
        apiFetch("/api/integrations/sheets") as Promise<LeadSource[]>,
        apiFetch("/api/integrations/meta") as Promise<LeadSource[]>,
      ]);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setSheets(Array.isArray(sheetsData) ? sheetsData : []);
      setMetaSources(Array.isArray(metaData) ? metaData : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Compute stats
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "WON").length;
  const newToday = leads.filter((l) => {
    if (!l.enquiryEntry) return false;
    const today = new Date();
    // try to match en-IN date strings like "11/11/2026"
    const match = l.enquiryEntry.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, d, m, y] = match;
      return (
        Number(d) === today.getDate() &&
        Number(m) === today.getMonth() + 1 &&
        Number(y) === today.getFullYear()
      );
    }
    return false;
  }).length;

  const statusCounts = leads.reduce(
    (acc, l) => {
      const s = l.status || "NEW";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusOrder = [
    "NEW",
    "ATTENDED",
    "CALL_BACK",
    "INTERESTED",
    "FOLLOW_UP",
    "NO_RESPONSE",
    "VISITING_STORE",
    "WON",
    "LOST",
  ];

  const recentLeads = [...leads].slice(0, 6);

  const sourceLeads = {
    manual: leads.filter((l) => !l.source || l.source === "manual").length,
    meta: leads.filter((l) => l.source === "meta").length,
    sheets: leads.filter((l) => l.source === "google_sheets").length,
  };

  return (
    <div className="OVPage">
      {/* Header */}
      <div className="OVHeader">
        <div>
          <p className="PageTag">Overview</p>
          <h1 className="OVTitle">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="OVSubtitle">Here&apos;s a snapshot of your CRM today.</p>
        </div>
        <Link href="/dashboard/leads" className="OVCTABtn">
          View All Leads
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="OVStats">
        <StatCard icon={Users} label="Total Leads" value={loading ? "—" : totalLeads} color="#2563eb" href="/dashboard/leads" />
        <StatCard icon={Clock} label="New Today" value={loading ? "—" : newToday} color="#f59e0b" />
        <StatCard icon={CheckCircle2} label="Won" value={loading ? "—" : wonLeads} color="#16a34a" />
        <StatCard icon={Link2} label="Integrations" value={loading ? "—" : sheets.length + metaSources.length} color="#7c3aed" href="/dashboard/integrations" />
      </div>

      <div className="OVBody">
        {/* Status breakdown */}
        <div className="OVCard">
          <div className="OVCardHeader">
            <TrendingUp size={16} />
            <span>Leads by Status</span>
          </div>
          <div className="OVStatusList">
            {loading ? (
              <p className="OVLoading">Loading…</p>
            ) : totalLeads === 0 ? (
              <p className="OVEmpty">No leads yet. <Link href="/dashboard/leads">Add your first lead →</Link></p>
            ) : (
              statusOrder.map((s) => {
                const count = statusCounts[s] ?? 0;
                if (count === 0) return null;
                const pct = Math.round((count / totalLeads) * 100);
                return (
                  <div className="OVStatusRow" key={s}>
                    <span className="OVStatusDot" style={{ background: STATUS_COLORS[s] ?? "#94a3b8" }} />
                    <span className="OVStatusName">{s.replace(/_/g, " ")}</span>
                    <div className="OVStatusBar">
                      <div
                        className="OVStatusBarFill"
                        style={{ width: `${pct}%`, background: STATUS_COLORS[s] ?? "#94a3b8" }}
                      />
                    </div>
                    <span className="OVStatusCount">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="OVRight">
          {/* Recent leads */}
          <div className="OVCard">
            <div className="OVCardHeader">
              <PhoneCall size={16} />
              <span>Recent Leads</span>
              <Link href="/dashboard/leads" className="OVCardLink">View all →</Link>
            </div>
            <div className="OVRecentList">
              {loading ? (
                <p className="OVLoading">Loading…</p>
              ) : recentLeads.length === 0 ? (
                <p className="OVEmpty">No leads yet.</p>
              ) : (
                recentLeads.map((l) => (
                  <div className="OVRecentItem" key={l.id}>
                    <div className="OVRecentAvatar">
                      {(l.phoneNumber || "?").slice(-2)}
                    </div>
                    <div className="OVRecentInfo">
                      <span className="OVRecentPhone">{l.phoneNumber || "No number"}</span>
                      <span className="OVRecentReq">{l.requirements || l.clientName || "—"}</span>
                    </div>
                    <span
                      className="OVRecentStatus"
                      style={{
                        background: (STATUS_COLORS[l.status ?? "NEW"] ?? "#94a3b8") + "22",
                        color: STATUS_COLORS[l.status ?? "NEW"] ?? "#94a3b8",
                      }}
                    >
                      {(l.status ?? "NEW").replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lead sources */}
          <div className="OVCard">
            <div className="OVCardHeader">
              <Link2 size={16} />
              <span>Lead Sources</span>
              <Link href="/dashboard/integrations" className="OVCardLink">Manage →</Link>
            </div>
            <div className="OVSourceList">
              <div className="OVSourceItem">
                <span className="OVSourceDot" style={{ background: "#6b7280" }} />
                <span className="OVSourceName">Manual entry</span>
                <span className="OVSourceCount">{loading ? "—" : sourceLeads.manual}</span>
              </div>
              <div className="OVSourceItem">
                <span className="OVSourceDot" style={{ background: "#2563eb" }} />
                <span className="OVSourceName">
                  <Zap size={12} style={{ marginRight: 4 }} />
                  Meta Lead Ads
                </span>
                <span className="OVSourceCount">{loading ? "—" : sourceLeads.meta}</span>
              </div>
              <div className="OVSourceItem">
                <span className="OVSourceDot" style={{ background: "#16a34a" }} />
                <span className="OVSourceName">
                  <Sheet size={12} style={{ marginRight: 4 }} />
                  Google Sheets
                </span>
                <span className="OVSourceCount">{loading ? "—" : sourceLeads.sheets}</span>
              </div>
            </div>
            {!loading && sheets.length === 0 && metaSources.length === 0 && (
              <Link href="/dashboard/integrations" className="OVIntCTA">
                <Link2 size={14} />
                Connect your first integration
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
