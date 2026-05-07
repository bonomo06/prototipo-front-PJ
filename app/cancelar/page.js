'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './cancelar.module.css';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

export default function CancelarPage() {
  const router = useRouter();

  const [phone, setPhone]       = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [confirmId, setConfirmId]           = useState(null);
  const [cancelling, setCancelling]         = useState(false);
  const [cancelError, setCancelError]       = useState('');
  const [cancelledBooking, setCancelledBooking] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setBookings(null);

    try {
      const res = await fetch(`/api/bookings?phone=${encodeURIComponent(phone.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao buscar');
      setBookings(json.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirmId) return;
    setCancelling(true);
    setCancelError('');

    const booking = bookings.find(b => b.id === confirmId);

    try {
      const res = await fetch(`/api/bookings/${confirmId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cancelar');

      setCancelledBooking(booking);
      setConfirmId(null);
    } catch (err) {
      setCancelError(err.message);
      setCancelling(false);
    }
  }

  function handleReschedule(booking) {
    const params = new URLSearchParams({
      services: booking.service_ids.join(','),
      barber: booking.barber_id,
    });
    router.push(`/?${params.toString()}`);
  }

  // Tela de sucesso pós-cancelamento
  if (cancelledBooking) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Cancelado!</h1>
          <p className={styles.successText}>
            Seu agendamento do dia{' '}
            <strong>{formatDate(cancelledBooking.booking_date)}</strong> às{' '}
            <strong>{formatTime(cancelledBooking.booking_time)}</strong> foi cancelado
            com sucesso.
          </p>
          <button
            className={styles.btn}
            onClick={() => handleReschedule(cancelledBooking)}
          >
            Remarcar agendamento
          </button>
          <button
            className={styles.btnOutline}
            onClick={() => {
              setCancelledBooking(null);
              setBookings(null);
              setPhone('');
            }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => router.push('/')}>
        ← Voltar
      </button>

      <h1 className={styles.title}>
        Meus <span>Agendamentos</span>
      </h1>
      <p className={styles.subtitle}>
        Digite seu celular para ver e cancelar agendamentos futuros
      </p>

      <form className={styles.form} onSubmit={handleSearch}>
        <input
          className={styles.input}
          type="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <button className={styles.btn} type="submit" disabled={loading || !phone.trim()}>
          {loading ? 'Buscando...' : 'Buscar agendamentos'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {bookings !== null && (
        <div className={styles.list} style={{ marginTop: 40 }}>
          {bookings.length === 0 ? (
            <p className={styles.empty}>Nenhum agendamento futuro encontrado para este número.</p>
          ) : (
            bookings.map(b => (
              <div key={b.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.dateTime}>
                      {formatDate(b.booking_date)} às{' '}
                      <span>{formatTime(b.booking_time)}</span>
                    </p>
                    <p className={styles.barber}>{b.barber_name}</p>
                  </div>
                  <p className={styles.price}>R$ {b.total_price}</p>
                </div>
                <p className={styles.services}>{b.service_names.join(' + ')}</p>
                <div className={styles.cardActions}>
                  <button
                    className={styles.btnCancel}
                    onClick={() => { setConfirmId(b.id); setCancelError(''); }}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.btnReschedule}
                    onClick={() => handleReschedule(b)}
                  >
                    Reagendar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmId && (
        <div className={styles.overlay} onClick={() => !cancelling && setConfirmId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Cancelar agendamento?</p>
            <p className={styles.modalText}>
              Esta ação não pode ser desfeita. O horário será liberado na agenda do barbeiro.
            </p>
            {cancelError && <p className={styles.error}>{cancelError}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setConfirmId(null)}
                disabled={cancelling}
              >
                Voltar
              </button>
              <button
                className={styles.btnCancel}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
