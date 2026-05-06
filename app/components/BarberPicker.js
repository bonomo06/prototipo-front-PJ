import styles from './BarberPicker.module.css';

export default function BarberPicker({ barbers, selected, onSelect }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Escolha o <span>Profissional</span></h2>
      <p className={styles.subtitle}>Com quem você quer agendar?</p>
      <div className={styles.grid}>
        {barbers.map(barber => {
          const isSelected = selected?.id === barber.id;
          return (
            <button
              key={barber.id}
              className={`${styles.card} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelect(barber)}
            >
              <div className={styles.avatar}>
                {barber.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.name}>{barber.name}</span>
              {isSelected && <span className={styles.check}>✓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
