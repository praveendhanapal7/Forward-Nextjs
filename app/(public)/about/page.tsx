import { FaGem, FaRocket, FaHandshake, FaCheckCircle } from "react-icons/fa";
import "@/styles/Pages.css";

const values = [
  { title: "High Quality at Nominal Pricing", text: "Forward Agency was built to deliver premium-quality marketing execution at a service cost that growing businesses can confidently afford.", icon: FaGem },
  { title: "Social-First Growth Model", text: "Our core focus is social media marketing and video content creation because this is where modern attention, trust, and enquiries are built.", icon: FaRocket },
  { title: "Client-Centered Delivery", text: "Every campaign and creative is shaped through active client input, fast corrections, and practical communication throughout execution.", icon: FaHandshake },
];

const promises = [
  "Clear communication before and after every delivery",
  "Multiple quality checks before content goes live",
  "Prompt correction support whenever changes are needed",
  "Strategy aligned to business growth, not just vanity metrics",
];

export const metadata = { title: "About — FORWARD Agency" };

export default function About() {
  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">About FORWARD</p>
        <h1 className="PageTitle">A Practical Agency for Real Business Growth</h1>
        <p className="PageLead">
          Forward Agency provides high-quality digital marketing services at a
          nominal price. Our mission is simple: help brands become visible,
          trusted, and profitable through consistent strategy, better content,
          and stronger campaign execution.
        </p>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Who We Are</h2>
        <div className="NarrativeBlock">
          <p>We are a marketing and editing agency focused on performance and brand trust. Instead of fragmented delivery, we combine planning, script support, content production, account handling, and campaign execution in one connected workflow.</p>
          <p>This approach helps businesses avoid confusion, reduce delays, and build momentum through weekly targets and consistent improvement.</p>
        </div>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Our Core Strengths</h2>
        <div className="PageGrid">
          {values.map(({ title, text, icon: Icon }) => (
            <article key={title} className="InfoCard">
              <div className="IconTitle">
                <span className="CardIcon"><Icon /></span>
                <h3>{title}</h3>
              </div>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">What Clients Can Expect</h2>
        <article className="InfoCard">
          <ul className="FeatureList">
            {promises.map((item) => (
              <li key={item}><FaCheckCircle /><span>{item}</span></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
