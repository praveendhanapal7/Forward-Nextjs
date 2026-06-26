import {
  FaBullseye,
  FaCalendarCheck,
  FaComments,
  FaVideo,
  FaSearch,
  FaCheckCircle,
} from "react-icons/fa";
import "@/styles/Pages.css";

const focusAreas = [
  { title: "Sales + Brand Awareness", text: "We work on conversion-focused growth while building long-term brand trust in the market.", icon: FaBullseye },
  { title: "Weekly Target System", text: "Execution is structured with weekly targets so progress stays measurable and consistent.", icon: FaCalendarCheck },
  { title: "Personalized Conversations", text: "Lead conversations are guided with personalized responses that move prospects toward calls.", icon: FaComments },
  { title: "Trust-Building Content", text: "Customer review, informative, and product delivery videos are used to improve credibility.", icon: FaVideo },
];

const workflow = [
  { title: "Client Brief + Goal Clarity", text: "Understand brand position, weekly requirements, and expected growth outcomes." },
  { title: "Analysis + Content Direction", text: "Review current performance and define the exact content/campaign path." },
  { title: "Editing + Quality Check", text: "Content is reviewed through multiple quality checks before client sharing." },
  { title: "Verification + Prompt Revision", text: "Corrections are implemented quickly to maintain quality and publishing speed." },
];

export const metadata = { title: "Our Work — FORWARD Agency" };

export default function Works() {
  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Our Work</p>
        <h1 className="PageTitle">Execution Built on Quality and Consistency</h1>
        <p className="PageLead">
          Forward follows a practical workflow that combines analysis, editing,
          quality control, and client verification. This keeps content quality
          high while ensuring fast delivery and measurable growth.
        </p>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Main Focus Areas</h2>
        <div className="PageGrid2">
          {focusAreas.map(({ title, text, icon: Icon }) => (
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
        <h2 className="PageSectionTitle">How Every Project Moves</h2>
        <div className="PageGrid2">
          {workflow.map((step) => (
            <article key={step.title} className="InfoCard">
              <div className="IconTitle">
                <span className="CardIcon"><FaSearch /></span>
                <h3>{step.title}</h3>
              </div>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="PageSection">
        <article className="InfoCard HighlightCard">
          <div className="IconTitle">
            <span className="CardIcon"><FaCheckCircle /></span>
            <h3>Quality Promise</h3>
          </div>
          <p>
            Multiple content checks are performed in each cycle, and all
            important adjustments are considered with prompt response support.
          </p>
        </article>
      </div>
    </section>
  );
}
