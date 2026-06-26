import ProtectedRoute from "@/components/auth/ProtectedRoute";
import "@/styles/Dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="DashShell">{children}</div>
    </ProtectedRoute>
  );
}
