"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Activity,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
  { label: "Logs", href: "/dashboard/logs", icon: Activity },
];

const ownerNavItems = [
  { label: "People", href: "/dashboard/people", icon: UserCog },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  onMobileOpen?: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isAgency } = useAuth();
  const isOwner = user?.accountType === "client" || isAgency;

  const handleSignOut = async () => {
    onMobileClose();
    await signOut();
    router.replace("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      {mobileOpen && (
        <div
          className="DashSidebarOverlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "DashSidebar",
          collapsed ? "DashSidebarCollapsed" : "",
          mobileOpen ? "DashSidebarMobileOpen" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="DashSidebarHeader">
          {!collapsed && (
            <Link href="/dashboard" className="DashSidebarLogo" onClick={onMobileClose}>
              <Image
                src="/Images/forward-logo.png"
                alt="Forward Agency"
                width={140}
                height={36}
                priority
                style={{
                  width: 140,
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "left",
                }}
              />
            </Link>
          )}
          <button
            className="DashSidebarCollapseBtn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        <nav className="DashSidebarNav">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`DashSidebarLink ${pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? "DashSidebarLinkActive" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
          {isOwner && ownerNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`DashSidebarLink ${pathname.startsWith(href) ? "DashSidebarLinkActive" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="DashSidebarFooter">
          {!collapsed && user && (
            <div className="DashSidebarUser">
              <span className="DashSidebarAvatar">{initials}</span>
              <div className="DashSidebarUserInfo">
                <span className="DashSidebarUserName">
                  {user.name?.split(" ")[0]}
                </span>
                <span className="DashSidebarUserRole">
                  {user.brandName || user.accountType}
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div
              className="DashSidebarAvatarOnly"
              title={user?.name ?? "User"}
            >
              <span className="DashSidebarAvatar">{initials}</span>
            </div>
          )}

          <Link
            href="/services"
            onClick={onMobileClose}
            className="DashSidebarFooterLink"
            title={collapsed ? "Back to site" : undefined}
          >
            <ExternalLink size={15} />
            {!collapsed && <span>Back to site</span>}
          </Link>

          <button
            onClick={handleSignOut}
            className="DashSidebarLogout"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
