'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { People, Search } from './icons';
import { initialsOf } from './Avatar';
import { getStudent, CURRENT_USER_ID } from '@/lib/data';

export default function ProfileFab() {
  const pathname = usePathname();
  return <ProfileMenu key={pathname} pathname={pathname} />;
}

function ProfileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = getStudent(CURRENT_USER_ID);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="fab" ref={ref}>
      {open && (
        <nav aria-label="Profiles" id="profile-menu" className="fab__menu">
          <Link href="/profile" className="fab__link" aria-current={pathname === '/profile' ? 'page' : undefined}>
            <span aria-hidden="true" className="fab__icon fab__icon--me">
              {me ? initialsOf(me.name) : 'ME'}
            </span>
            Your profile
          </Link>
          <Link href="/students" className="fab__link" aria-current={pathname === '/students' ? 'page' : undefined}>
            <span aria-hidden="true" className="fab__icon">
              <Search />
            </span>
            Explore profiles
          </Link>
        </nav>
      )}
      <button type="button" className="fab__btn" aria-label="Profiles" aria-expanded={open} aria-controls="profile-menu" onClick={() => setOpen((o) => !o)}>
        <People />
      </button>
    </div>
  );
}
