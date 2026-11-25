import styles from './welcome.module.css';

export default function LogoMark({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? styles.logoMarkLarge : styles.logoMark} aria-hidden="true">
      <span>U</span>
      <span className={styles.logoMarkDot} />
    </span>
  );
}
