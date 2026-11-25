import { LANDING_CONFIG } from './landing.config';
import styles from './welcome.module.css';

export default function Grain() {
  return (
    <div
      className={styles.grain}
      style={{ opacity: LANDING_CONFIG.grain.opacity }}
      aria-hidden="true"
    />
  );
}
