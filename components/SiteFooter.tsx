import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" className="site-footer__mark">UGSOT®</Link>
      <span className="mono">CampusHub · UGSOT</span>
    </footer>
  );
}
