import styles from './ClientForm.module.css';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2)  return digits;
  if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

export default function ClientForm({ name, phone, onChangeName, onChangePhone }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Seus <span>Dados</span></h2>
      <p className={styles.subtitle}>Para confirmar seu agendamento</p>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="client-name">Nome</label>
          <input
            id="client-name"
            className={styles.input}
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={e => onChangeName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="client-phone">Telefone / WhatsApp</label>
          <input
            id="client-phone"
            className={styles.input}
            type="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={e => onChangePhone(formatPhone(e.target.value))}
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>
      </div>
    </section>
  );
}
