import styles from './StepProgress.module.css';

const LABELS = ['Serviço', 'Barbeiro', 'Data', 'Horário', 'Dados', 'Resumo'];

export default function StepProgress({ current }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.dots}>
        {LABELS.map((label, i) => {
          const stepNum = i + 1;
          const state =
            stepNum < current  ? 'done'   :
            stepNum === current ? 'active' : 'pending';
          return (
            <div key={stepNum} className={styles.dotItem}>
              <div className={`${styles.dot} ${styles[state]}`}>
                {state === 'done' ? '✓' : stepNum}
              </div>
              {i < LABELS.length - 1 && (
                <div className={`${styles.line} ${stepNum < current ? styles.lineDone : ''}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className={styles.stepLabel}>{LABELS[current - 1]}</p>
    </div>
  );
}
