import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <Link className="site-footer__brand" href="/" aria-label="Vector Flow home">
            <BrandLogo className="site-footer__logo" />
            <span>
              <strong>Vector Flow</strong>
              <span>VVCE · CSE (AI &amp; ML)</span>
            </span>
          </Link>
          <p>Building, learning, and creating together at VVCE Mysore.</p>
        </div>
        <nav className="site-footer__columns" aria-label="Footer">
          <div className="site-footer__column">
            <h2 className="site-footer__column-title">Explore</h2>
            <Link href="/">Home</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/team">Team</Link>
            <Link href="/participation">Participation</Link>
          </div>
          <div className="site-footer__column">
            <h2 className="site-footer__column-title">Contact</h2>
            <a href="mailto:vectorflow@vvce.ac.in">vectorflow@vvce.ac.in</a>
          </div>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <p>© 2026 Vector Flow, VVCE · CSE (AI &amp; ML)</p>
      </div>
    </footer>
  );
}
