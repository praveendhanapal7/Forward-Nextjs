"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

interface TopBarProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function useRelativeTime(date: Date | null) {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    const update = () => {
      const diff = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diff < 10) setLabel("just now");
      else if (diff < 60) setLabel(`${diff}s ago`);
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)}m ago`);
      else setLabel(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    const t = setInterval(update, 15000);
    return () => clearInterval(t);
  }, [date]);

  return label;
}

export function TopBar({ lastUpdated, isRefreshing, onRefresh }: TopBarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const relativeTime = useRelativeTime(lastUpdated);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/signin");
  };

  return (
    <header className="DashTopBar">
      <div className="DashTopBarTitle">Lead Management Portal</div>

      <div className="DashTopBarRight">
        {lastUpdated && (
          <span className="DashTopBarMeta">
            {isRefreshing ? "Refreshing…" : `Updated ${relativeTime}`}
          </span>
        )}
        <button
          className={`DashTopBarRefreshBtn ${isRefreshing ? "DashTopBarRefreshBtnSpinning" : ""}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh leads"
          title="Refresh leads"
        >
          <RefreshCw size={15} />
        </button>
        {user?.name && (
          <span className="DashTopBarUser">Hi, {user.name.split(" ")[0]}</span>
        )}
        <button
          className="DashTopBarSignOutBtn"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
