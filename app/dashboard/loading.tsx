import "@/styles/Pages.css";

export default function DashboardLoading() {
  return (
    <>
      <style>{`
        .SkeletonLine {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* TopBar skeleton */}
      <div style={{ height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <div className="SkeletonLine" style={{ width: 200, height: 18 }} />
        <div style={{ flex: 1 }} />
        <div className="SkeletonLine" style={{ width: 80, height: 14 }} />
        <div className="SkeletonLine" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>

      <section className="PageShell">
        <div className="PageHero">
          <div className="SkeletonLine" style={{ width: 80, height: 14, marginBottom: 12 }} />
          <div className="SkeletonLine" style={{ width: 260, height: 28, marginBottom: 10 }} />
          <div className="SkeletonLine" style={{ width: 380, height: 18 }} />
        </div>

        <div className="PageSection">
          <div className="SkeletonLine" style={{ width: 200, height: 22, marginBottom: 16 }} />
          <div className="DashboardTopGrid">
            <div className="InfoCard" style={{ minHeight: 220, display: "flex", flexDirection: "column", gap: 14, padding: 24 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="SkeletonLine" style={{ height: 42, borderRadius: 10 }} />
              ))}
              <div className="SkeletonLine" style={{ height: 46, borderRadius: 10, marginTop: 8 }} />
            </div>
            <div className="InfoCard StatusGraphCard" style={{ minHeight: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="SkeletonLine" style={{ width: 100, height: 13 }} />
                  <div className="SkeletonLine" style={{ width: 160, height: 22 }} />
                </div>
                <div className="SkeletonLine" style={{ width: 70, height: 70, borderRadius: 12 }} />
              </div>
              <div className="SkeletonLine" style={{ width: "100%", height: 220, borderRadius: 12 }} />
            </div>
          </div>
        </div>

        <div className="PageSection">
          <div className="SkeletonLine" style={{ width: 120, height: 22, marginBottom: 16 }} />
          <div className="InfoCard" style={{ padding: 20, overflowX: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 600 }}>
              <div className="SkeletonLine" style={{ height: 36, borderRadius: 8, background: "#f3f4f6" }} />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="SkeletonLine" style={{ height: 52, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
