import {
  FaBullhorn,
  FaChartLine,
  FaPenNib,
  FaVideo,
  FaUsersCog,
  FaHeadset,
  FaHashtag,
} from "react-icons/fa";
import "@/styles/App.css";

const services = [
  { title: "Social Media Marketing", description: "Build consistent brand visibility through platform-focused content and strategy.", icon: FaHashtag },
  { title: "Meta Ads & Google Ads", description: "Run performance campaigns to attract quality leads and maximize ROI.", icon: FaBullhorn },
  { title: "Brand Strategy", description: "Define your positioning, messaging, and growth direction for long-term value.", icon: FaChartLine },
  { title: "Script Writing", description: "Create hook-driven scripts for ads, reels, and high-engagement video content.", icon: FaPenNib },
  { title: "Video Editing", description: "Deliver polished edits that improve retention, clarity, and brand impact.", icon: FaVideo },
  { title: "Account Handling", description: "Manage posting, content flow, and day-to-day execution across social channels.", icon: FaUsersCog },
  { title: "Enquiry Response", description: "Support fast lead response workflows to improve trust and close opportunities.", icon: FaHeadset },
];

export default function AfterHeroSection() {
  return (
    <section className="AfterHeroSection">
      <p className="SectionTag">Our Services</p>
      <h2 className="SectionTitle">What FORWARD Delivers</h2>
      <p className="SectionSubtitle">
        We build visibility, quality leads, and scalable marketing systems.
      </p>
      <div className="ServiceGrid">
        {services.map(({ title, description, icon: Icon }) => (
          <article key={title} className="ServiceCard">
            <div className="ServiceHead">
              <div className="ServiceIconWrap">
                <Icon className="ServiceIcon" />
              </div>
              <h3>{title}</h3>
            </div>
            <p className="ServiceDescription">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
