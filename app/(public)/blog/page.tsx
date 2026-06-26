import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { blogPosts } from "@/lib/blogPosts";
import "@/styles/Pages.css";

const notes = [
  "Personalized enquiry conversations increase call conversion potential",
  "Fast correction loops maintain quality and publishing discipline",
  "Structured weekly targets keep marketing efforts accountable",
];

export const metadata = { title: "Blog — FORWARD Agency" };

export default function Blog() {
  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">Blog</p>
        <h1 className="PageTitle">Detailed Insights from Real Agency Execution</h1>
        <p className="PageLead">
          These articles are based on practical workflow used in Forward Agency,
          covering planning, production, quality, and performance-driven growth.
        </p>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Featured Reads</h2>
        <div className="PageGrid">
          {blogPosts.map(({ slug, category, title, text, icon: Icon }) => (
            <article key={slug} className="InfoCard BlogCard">
              <div className="IconTitle">
                <span className="CardIcon"><Icon /></span>
                <span className="Meta">{category}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={`/blog/${slug}`}>Read More</Link>
            </article>
          ))}
        </div>
      </div>

      <div className="PageSection">
        <h2 className="PageSectionTitle">Quick Performance Notes</h2>
        <article className="InfoCard">
          <ul className="FeatureList">
            {notes.map((note) => (
              <li key={note}><FaCheckCircle /><span>{note}</span></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
