import Link from "next/link";
import "@/styles/App.css";

export default function HeroBanner() {
  return (
    <section
      className="HeroBanner"
      style={
        {
          "--hero-bg":
            "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 42%, rgba(255,255,255,0.30) 72%, rgba(255,255,255,0.05) 100%), url(/assets/HeroBanner.png)",
        } as React.CSSProperties
      }
    >
      <div className="HeroContent">
        <p className="HeroEyebrow">FORWARD AGENCY</p>
        <h1 className="HeroTitle">
          Grow Your Brand
          <br />
          With Smart
          <br />
          <span className="HeroTitleSpan">Digital Marketing</span>
          <span className="HeroTitleSpanMobile">
            Digital
            <br />
            Marketing
          </span>
        </h1>
        <p className="HeroDescription">
          We help businesses scale with performance-driven strategy, creative
          campaigns, and strong brand positioning.
        </p>
        <div className="HeroActions">
          <Link
            href="/get-started"
            className="HeroBtn HeroBtnPrimary HeroBtnLink"
          >
            Get Started
          </Link>
          <Link
            href="/services"
            className="HeroBtn HeroBtnSecondary HeroBtnLink"
          >
            View Services
          </Link>
        </div>
      </div>
    </section>
  );
}
