import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPostBySlug } from "@/lib/blogPosts";
import "@/styles/Pages.css";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  return { title: post ? `${post.title} — FORWARD Agency` : "Not Found" };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const Icon = post.icon;

  return (
    <section className="PageShell">
      <div className="PageHero">
        <p className="PageTag">{post.category}</p>
        <h1 className="PageTitle">{post.title}</h1>
        <p className="PageLead">{post.text}</p>
      </div>

      <div className="PageSection">
        <article className="InfoCard">
          <div className="IconTitle">
            <span className="CardIcon"><Icon /></span>
            <h3>Detailed Breakdown</h3>
          </div>
          <div className="NarrativeBlock">
            {post.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p style={{ marginTop: "16px" }}>
            <Link href="/blog">← Back to Blog</Link>
          </p>
        </article>
      </div>
    </section>
  );
}
