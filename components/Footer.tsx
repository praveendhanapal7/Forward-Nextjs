import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import "@/styles/Footer.css";

export default function Footer() {
  return (
    <footer className="FooterSection">
      <div className="FooterTop">
        <div className="FooterBrand">
          <h3>FORWARD AGENCY</h3>
          <p>
            We help brands grow visibility, generate quality leads, and scale
            with strategic digital marketing systems.
          </p>
        </div>

        <div className="FooterLinks">
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/signin">Sign In</Link></li>
          </ul>
        </div>

        <div className="FooterContact">
          <h4>Contact</h4>
          <div className="FooterContactItem">
            <Mail size={15} />
            <span>forwardenquiries@gmail.com</span>
          </div>
          <div className="FooterContactItem">
            <Phone size={15} />
            <span>+91 9361045774</span>
          </div>
          <div className="FooterContactItem">
            <Phone size={15} />
            <span>+91 9443069400</span>
          </div>
          <div className="FooterContactItem">
            <MapPin size={15} />
            <span>Ondipudur Coimbatore, Tamil Nadu, India</span>
          </div>
        </div>
      </div>

      <div className="FooterBottom">
        <p>© 2026 FORWARD Agency. All rights reserved.</p>
      </div>
    </footer>
  );
}
