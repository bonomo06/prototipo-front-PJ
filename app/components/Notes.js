import styles from "./Notes.module.css";

export default function Notes({ value, onChange }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <span>Observacoes</span>
      </h2>
      <textarea
        className={styles.textarea}
        placeholder="Ex: cabelo crespo, prefiro tesoura, referencia de foto..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </section>
  );
}
