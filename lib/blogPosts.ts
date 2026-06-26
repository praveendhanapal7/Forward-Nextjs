import { FaBullhorn, FaPlayCircle, FaLightbulb } from "react-icons/fa";
import type { IconType } from "react-icons";

export interface BlogPost {
  slug: string;
  category: string;
  title: string;
  text: string;
  icon: IconType;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "sales-and-brand-trust-campaign",
    category: "Campaign Focus",
    title: "How to Balance Sales and Brand Trust in One Campaign",
    text: "Forward's core model combines lead-focused action with long-term awareness using weekly targets and audience-specific messaging.",
    icon: FaBullhorn,
    body: [
      "Most brands either push sales too aggressively or focus only on awareness with no enquiry system. The better approach is to design both together.",
      "At Forward, campaign planning starts with weekly targets, audience clarity, and message intent. This helps us maintain conversion momentum while improving trust through consistent communication.",
      "When sales action and brand confidence move together, performance becomes more stable and less dependent on random short-term boosts.",
    ],
  },
  {
    slug: "video-types-for-enquiry-quality",
    category: "Content System",
    title: "Three Video Types That Improve Enquiry Quality",
    text: "Customer review videos, informative content, and product delivery videos help audiences trust faster and respond with intent.",
    icon: FaPlayCircle,
    body: [
      "High enquiry quality usually starts with high trust content. In practice, three formats perform consistently: real customer review videos, informative problem-solving clips, and product delivery proof videos.",
      "This mix answers key buyer questions before the first call: Is this brand reliable? Is this offer clear? Is there real proof of delivery?",
      "When these content types run in sequence, response conversations become easier and conversion discussions become faster.",
    ],
  },
  {
    slug: "quality-checks-before-publishing",
    category: "Operations",
    title: "Why Quality Checks Matter Before Publishing",
    text: "Multiple content checks, client verification, and prompt corrections reduce errors and improve campaign consistency.",
    icon: FaLightbulb,
    body: [
      "A lot of performance drops happen due to avoidable execution errors: wrong copy, weak edits, timing issues, or unclear messaging.",
      "Forward uses a quality-check workflow before publishing. Content is reviewed internally, verified with client context, and refined through fast correction loops.",
      "This discipline protects brand perception and keeps campaign output consistent over weeks, not just for one good post.",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
