'use client';

import { useEffect, useState } from 'react';
import { LANDING_CONFIG } from './landing.config';
import styles from './welcome.module.css';

export default function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(LANDING_CONFIG.clock.locale, {
      timeZone: LANDING_CONFIG.clock.timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const updateTime = () => setTime(formatter.format(new Date()));

    updateTime();
    const intervalId = window.setInterval(updateTime, LANDING_CONFIG.clock.intervalMs);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <p className={styles.clock} aria-label="Current local time in Pune">
      <span>Pune, India</span>
      <time suppressHydrationWarning>{time || '--:--:--'}</time>
      <span>IST</span>
    </p>
  );
}
