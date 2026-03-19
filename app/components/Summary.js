import styles from "./Summary.module.css";

export default function Summary({ services, date, time, price, duration }) {
  return (
    <div className={styles.summary}>
      <div className={styles.header}>RESUMO</div>
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.label}>Servico(s)</span>
          <span className={styles.value}>
            {services.length > 0 ? services.join(", ") : "-"}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Data</span>
          <span className={styles.value}>{date}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Horario</span>
          <span className={styles.value}>{time}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Duracao</span>
          <span className={styles.value}>{duration} min</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Total</span>
          <span className={`${styles.value} ${styles.price}`}>
            R$ {price}
          </span>
        </div>
      </div>
    </div>
  );
}
