import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <Image
            src="/logoPJ.jpg"
            alt="PJ do Corte"
            width={48}
            height={48}
            className={styles.logoImg}
          />
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>PJ DO CORTE</h1>
          <p className={styles.sub}>Barbearia</p>
        </div>
        <span className={styles.badge}>Aberto</span>
      </div>
    </header>
  );
}
