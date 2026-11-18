import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" className="site-footer__mark">UGSOT®</Link>
      <Link href="/welcome" className="mono">Welcome</Link>
      <span className="mono">CampusHub · UGSOT</span>
    </footer>
  );
}
