'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import styles from './agendamento.module.css';

const BARBERSHOP_ADDRESS = 'R. São Lourenço, 282 - Jd. Bom Retiro, Salto - SP';
const MAPS_QUERY = encodeURIComponent(BARBERSHOP_ADDRESS);
const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
const MAPS_LINK  = `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`;

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5);
}

export default function AgendamentoPage() {
  const router        = useRouter();
  const params        = useParams();
  const searchParams  = useSearchParams();
  const id            = params.id;
  const phone         = searchParams.get('phone');

  const [booking, setBooking]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling]   = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelled, setCancelled]     = useState(false);

  useEffect(() => {
    if (!phone) {
      router.replace('/cancelar');
      return;
    }

    fetch(`/api/bookings/${id}?phone=${encodeURIComponent(phone)}`)
      .then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || 'Erro ao carregar');
        setBooking(json.booking);
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id, phone, router]);

  async function handleCancel() {
    setCancelling(true);
    setCancelError('');

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cancelar');

      setCancelled(true);
      setConfirmOpen(false);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (cancelled) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Cancelado!</h1>
          <p className={styles.successText}>
            Seu agendamento foi cancelado com sucesso. O horário foi liberado na agenda
            do barbeiro.
          </p>
          <button className={styles.btnPrimary} onClick={() => router.push('/')}>
            Fazer novo agendamento
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Carregando agendamento...</p>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className={styles.page}>
        <p className={styles.errorBox}>
          {loadError || 'Agendamento não encontrado'}
        </p>
        <button className={styles.btnOutline} onClick={() => router.push('/')}>
          Voltar ao início
        </button>
      </div>
    );
  }

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => router.push('/')}>
        ← Voltar
      </button>

      <h1 className={styles.title}>
        Meu <span>Agendamento</span>
      </h1>
      <p className={styles.subtitle}>Detalhes da sua reserva</p>

      <div className={styles.card}>
        <span
          className={`${styles.statusBadge} ${
            isCancelled ? styles.statusCancelled : styles.statusConfirmed
          }`}
        >
          {isCancelled ? 'Cancelado' : 'Confirmado'}
        </span>

        <div className={styles.dateTime}>
          {formatDate(booking.booking_date)} às{' '}
          <span>{formatTime(booking.booking_time)}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <span className={styles.rowLabel}>Cliente</span>
          <span className={styles.rowValue}>{booking.client_name}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Barbeiro</span>
          <span className={styles.rowValue}>{booking.barber_name}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Serviços</span>
          <span className={styles.rowValue}>{booking.service_names.join(' + ')}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Duração</span>
          <span className={styles.rowValue}>{booking.total_duration} min</span>
        </div>

        {booking.notes && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Observação</span>
            <span className={styles.rowValue}>{booking.notes}</span>
          </div>
        )}

        <div className={styles.divider} />

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalPrice}>R$ {booking.total_price}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.locationBlock}>
          <span className={styles.rowLabel}>Localização</span>
          <p className={styles.address}>{BARBERSHOP_ADDRESS}</p>
          <iframe
            className={styles.mapFrame}
            src={MAPS_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa da barbearia"
          />
          <a
            className={styles.btnMaps}
            href={MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Como chegar (Google Maps)
          </a>
        </div>

        {!isCancelled && (
          <div className={styles.actions}>
            <button
              className={styles.btnCancel}
              onClick={() => { setConfirmOpen(true); setCancelError(''); }}
            >
              Cancelar agendamento
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div
          className={styles.overlay}
          onClick={() => !cancelling && setConfirmOpen(false)}
        >
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Cancelar agendamento?</p>
            <p className={styles.modalText}>
              Esta ação não pode ser desfeita. O horário será liberado na agenda do barbeiro.
            </p>
            {cancelError && <p className={styles.error}>{cancelError}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setConfirmOpen(false)}
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
