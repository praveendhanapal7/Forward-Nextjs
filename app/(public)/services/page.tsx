import {
  FaSearch, FaClipboardList, FaPenNib, FaMicrophone,
  FaVideo, FaBullhorn, FaHeadset, FaGoogle, FaCheckCircle,
} from "react-icons/fa";
import "@/styles/Pages.css";

const serviceItems = [
  { title: "Competitor Analysis", desc: "Study competitor content, offer positioning, and ad direction before execution.", icon: FaSearch },
  { title: "Content Planning", desc: "Build a structured content calendar aligned to weekly brand growth goals.", icon: FaClipboardList },
  { title: "Script Writing", desc: "Prepare clear, audience-first scripts for ads, reels, and informative videos.", icon: FaPenNib },
  { title: "Voice Over", desc: "Support voice delivery for sharper messaging and better audience retention.", icon: FaMicrophone },
  { title: "Video Editing", desc: "Convert raw footage into performance-ready social content with quality checks.", icon: FaVideo },
  { title: "Social + Meta Ads", desc: "Run paid campaigns and social media activities focused on qualified lead generation.", icon: FaBullhorn },
  { title: "Enquiry Responses", desc: "Manage enquiry conversations with personalized responses that lead to calls.", icon: FaHeadset },
  { title: "Google Business Management", desc: "Maintain business presence for stronger local trust and discoverability.", icon: FaGoogle },
];

const process = [
  "Analyze current brand position and competitor movement",
  "Plan content and campaign structure for weekly targets",
  "Execute scripts, edits, account handling, and promotions",
  "Apply quality checks, client verification, and fast corrections",
];

export const metadata = { title: "Services — FORWARD Agency" };

export default function Service() {
  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Services</p>
        <h1 className="PageTitle">Complete Marketing Package for Growing Brands</h1>
        <p className="PageLead">
          Forward offers a full execution package for businesses that want one
          trusted team for strategy, content, ad campaigns, enquiry handling,
          and quality delivery.
        </p>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Everything Included in the Package</h2>
        <div className="PageGrid">
          {serviceItems.map(({ title, desc, icon: Icon }) => (
            <article key={title} className="InfoCard">
              <div className="IconTitle">
                <span className="CardIcon"><Icon /></span>
                <h3>{title}</h3>
              </div>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Service Workflow</h2>
        <article className="InfoCard">
          <ul className="FeatureList">
            {process.map((item) => (
              <li key={item}><FaCheckCircle /><span>{item}</span></li>
            ))}
          </ul>
        </article>
      </div>

      <div className="PageSection">
        <article className="InfoCard HighlightCard">
          <div className="IconTitle">
            <span className="CardIcon"><FaBullhorn /></span>
            <h3>Service Charge</h3>
          </div>
          <p>Complete package covering strategy, content, ads, and support: <strong>₹13,999</strong></p>
        </article>
      </div>
    </section>
  );
}
