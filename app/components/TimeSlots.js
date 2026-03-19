import styles from "./TimeSlots.module.css";

export default function TimeSlots({ times, selectedTime, onSelectTime }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        Escolha o <span>Horario</span>
      </h2>
      <div className={styles.grid}>
        {times.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const cls = [
            styles.slot,
            !slot.available && styles.taken,
            isSelected && styles.selected,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={slot.time}
              className={cls}
              disabled={!slot.available}
              onClick={() => slot.available && onSelectTime(slot.time)}
            >
              <span className={styles.time}>{slot.time}</span>
              <span className={styles.status}>
                {isSelected ? "Selecionado" : slot.available ? "Livre" : "Ocupado"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
