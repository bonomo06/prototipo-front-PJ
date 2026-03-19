import styles from "./ServicePicker.module.css";

const ICON_MAP = {
  scissors: "/icons/scissors.svg",
  razor: "/icons/razor.svg",
  combo: "/icons/combo.svg",
  relax: "/icons/relax.svg",
  color: "/icons/color.svg",
  child: "/icons/child.svg",
};

const ICON_FALLBACK = {
  scissors: "\u2702",
  razor: "\uD83E\uDE92",
  combo: "\u2702\uFE0F",
  relax: "\uD83D\uDC86",
  color: "\uD83C\uDFA8",
  child: "\uD83D\uDC76",
};

export default function ServicePicker({ services, selected, onToggle }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        Escolha o <span>Servico</span>
      </h2>
      <div className={styles.grid}>
        {services.map((svc) => {
          const isSelected = selected.includes(svc.id);
          return (
            <button
              key={svc.id}
              className={`${styles.card} ${isSelected ? styles.selected : ""}`}
              onClick={() => onToggle(svc.id)}
            >
              {isSelected && <span className={styles.check}>&#10003;</span>}
              <span className={styles.icon}>{ICON_FALLBACK[svc.icon]}</span>
              <span className={styles.name}>{svc.name}</span>
              <span className={styles.price}>R$ {svc.price}</span>
              <span className={styles.duration}>{svc.duration} min</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
