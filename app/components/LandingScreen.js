import Image from "next/image";
import styles from "./LandingScreen.module.css";

export default function LandingScreen({ onAgendar, onCancelar }) {
  return (
    <div className={styles.page}>
      <div className={styles.logoWrap}>
        <Image
          src="/logoPJ.jpg"
          alt="PJ do Corte"
          width={120}
          height={120}
          className={styles.logo}
          priority
        />
      </div>

      <h1 className={styles.name}>
        PJ <span>do</span> Corte
      </h1>
      <p className={styles.subtitle}>Barbearia</p>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onAgendar}>
          Fazer agendamento
        </button>
        <button className={styles.btnOutline} onClick={onCancelar}>
          Cancelar / Ver agendamentos
        </button>
      </div>
    </div>
  );
}
