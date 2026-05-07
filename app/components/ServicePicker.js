import { Scissors, Palette } from "lucide-react";
import styles from "./ServicePicker.module.css";

const ICON_MAP = {
  scissors: Scissors,
  razor: Scissors,
  combo: Scissors,
  relax: Scissors,
  color: Palette,
  child: Scissors,
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
          const Icon = ICON_MAP[svc.icon] ?? Scissors;
          return (
            <button
              key={svc.id}
              className={`${styles.card} ${isSelected ? styles.selected : ""}`}
              onClick={() => onToggle(svc.id)}
            >
              {isSelected && <span className={styles.check}>&#10003;</span>}
              <span className={styles.icon}>
                <Icon size={20} strokeWidth={1.5} />
              </span>
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
