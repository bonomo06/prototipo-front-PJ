"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Header from "./components/Header";
import LandingScreen from "./components/LandingScreen";
import StepProgress from "./components/StepProgress";
import ServicePicker from "./components/ServicePicker";
import BarberPicker from "./components/BarberPicker";
import Calendar from "./components/Calendar";
import TimeSlots from "./components/TimeSlots";
import Notes from "./components/Notes";
import ClientForm from "./components/ClientForm";
import Summary from "./components/Summary";

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function pad(n) { return String(n).padStart(2, '0'); }

// Fluxo: 1-Serviço | 2-Barbeiro | 3-Data | 4-Horário | 5-Dados | 6-Resumo
const TOTAL_STEPS = 6;

export default function Home() {
  const router = useRouter();
  const hasAppliedParams = useRef(false);

  // --- Wizard ---
  const [step, setStep] = useState(0);

  // --- Dados do agendamento ---
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber]     = useState(null); // {id, name}
  const [selectedDate, setSelectedDate]         = useState(null); // {day,month,year}
  const [selectedTime, setSelectedTime]         = useState(null);
  const [clientName, setClientName]             = useState('');
  const [clientPhone, setClientPhone]           = useState('');
  const [notes, setNotes]                       = useState('');

  // --- Dados da API ---
  const [services, setServices]   = useState([]);
  const [barbers, setBarbers]     = useState([]);
  const [busyDays, setBusyDays]   = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // --- UI ---
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingBarbers, setLoadingBarbers]   = useState(true);
  const [loadingDays, setLoadingDays]         = useState(false);
  const [loadingSlots, setLoadingSlots]       = useState(false);
  const [confirmState, setConfirmState]       = useState('idle'); // idle|loading|success|error
  const [errorMsg, setErrorMsg]               = useState('');

  // --- Derivados ---
  const totalPrice = useMemo(() =>
    selectedServices.reduce((sum, id) => {
      const svc = services.find(s => s.id === id);
      return sum + (svc?.price || 0);
    }, 0),
  [selectedServices, services]);

  const totalDuration = useMemo(() =>
    selectedServices.reduce((sum, id) => {
      const svc = services.find(s => s.id === id);
      return sum + (svc?.duration || 0);
    }, 0),
  [selectedServices, services]);

  const selectedServiceNames = useMemo(() =>
    selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean),
  [selectedServices, services]);

  const formattedDate = selectedDate
    ? `${selectedDate.day} de ${MONTHS[selectedDate.month]}`
    : 'Selecione';

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1: return selectedServices.length > 0;
      case 2: return selectedBarber !== null;
      case 3: return selectedDate !== null;
      case 4: return selectedTime !== null;
      case 5: return clientName.trim().length >= 2
                  && clientPhone.replace(/\D/g, '').length >= 10;
      default: return false;
    }
  }, [step, selectedServices, selectedBarber, selectedDate, selectedTime, clientName, clientPhone]);

  // --- Pré-selecionar serviços/barbeiro vindos do reagendamento (?services=1,2&barber=1) ---
  useEffect(() => {
    if (loadingServices || loadingBarbers || hasAppliedParams.current) return;
    const params = new URLSearchParams(window.location.search);
    const svcParam    = params.get('services');
    const barberParam = params.get('barber');
    if (!svcParam && !barberParam) return;
    hasAppliedParams.current = true;
    if (svcParam) {
      const ids = svcParam.split(',').map(Number).filter(id => services.some(s => s.id === id));
      if (ids.length) setSelectedServices(ids);
    }
    if (barberParam) {
      const barber = barbers.find(b => b.id === parseInt(barberParam, 10));
      if (barber) setSelectedBarber({ id: barber.id, name: barber.name });
    }
  }, [loadingServices, loadingBarbers, services, barbers]);

  // --- Buscar serviços e barbeiros na montagem ---
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(data => { setServices(Array.isArray(data) ? data : []); setLoadingServices(false); })
      .catch(() => setLoadingServices(false));

    fetch('/api/barbers')
      .then(r => r.json())
      .then(data => { setBarbers(Array.isArray(data) ? data : []); setLoadingBarbers(false); })
      .catch(() => setLoadingBarbers(false));
  }, []);

  // --- Buscar dias ocupados ao entrar no passo 3 (data) ou mudar de mês ---
  useEffect(() => {
    if (step !== 3 || !selectedBarber) return;
    setLoadingDays(true);
    const { month, year } = currentMonth;
    fetch(`/api/availability?month=${month + 1}&year=${year}&barberId=${selectedBarber.id}`)
      .then(r => r.json())
      .then(data => { setBusyDays(data.busyDays || []); setLoadingDays(false); })
      .catch(() => setLoadingDays(false));
  }, [step, currentMonth, selectedBarber]);

  // --- Buscar timeslots ao entrar no passo 4 (horário) ---
  useEffect(() => {
    if (step !== 4 || !selectedDate || !selectedBarber || totalDuration === 0) return;
    const { day, month, year } = selectedDate;
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/timeslots?date=${dateStr}&duration=${totalDuration}&barberId=${selectedBarber.id}`)
      .then(r => r.json())
      .then(data => { setTimeSlots(data.slots || []); setLoadingSlots(false); })
      .catch(() => setLoadingSlots(false));
  }, [step, selectedDate, totalDuration, selectedBarber]);

  // --- Navegação ---
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    setErrorMsg('');
    if (step > 1) setStep(s => s - 1);
  }, [step]);

  // Ao trocar de barbeiro, reseta data e horário (disponibilidade é por barbeiro)
  const handleSelectBarber = useCallback((barber) => {
    setSelectedBarber(barber);
    setSelectedDate(null);
    setSelectedTime(null);
    setBusyDays([]);
  }, []);

  // --- Confirmação ---
  const handleConfirm = async () => {
    setConfirmState('loading');
    setErrorMsg('');
    try {
      const { day, month, year } = selectedDate;
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds:    selectedServices,
          serviceNames:  selectedServiceNames,
          barberId:      selectedBarber.id,
          clientName,
          clientPhone,
          date:          dateStr,
          time:          selectedTime,
          totalDuration,
          totalPrice,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar');
      setConfirmState('success');
    } catch (err) {
      setConfirmState('error');
      setErrorMsg(err.message);
    }
  };

  // --- Tela de boas-vindas ---
  if (step === 0) {
    return (
      <LandingScreen
        onAgendar={() => setStep(1)}
        onCancelar={() => router.push('/cancelar')}
      />
    );
  }

  // --- Posição do track (1/6 por passo) ---
  const trackStyle = { transform: `translateX(calc(-100% / ${TOTAL_STEPS} * ${step - 1}))` };

  return (
    <main className={styles.main}>
      <div className={styles.wizardOuter}>
        <Header />
        <StepProgress current={step} />

        <div className={styles.stepsTrack} style={trackStyle}>

          {/* Passo 1 — Serviços */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              {loadingServices
                ? <div className={styles.loadingBox}><div className={styles.spinner} /><span>Carregando serviços...</span></div>
                : <ServicePicker
                    services={services}
                    selected={selectedServices}
                    onToggle={id => setSelectedServices(prev =>
                      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
                    )}
                  />
              }
            </div>
          </div>

          {/* Passo 2 — Barbeiro */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              {loadingBarbers
                ? <div className={styles.loadingBox}><div className={styles.spinner} /><span>Carregando profissionais...</span></div>
                : <BarberPicker
                    barbers={barbers}
                    selected={selectedBarber}
                    onSelect={handleSelectBarber}
                  />
              }
            </div>
          </div>

          {/* Passo 3 — Data */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              {loadingDays
                ? <div className={styles.loadingBox}><div className={styles.spinner} /><span>Verificando disponibilidade...</span></div>
                : <Calendar
                    currentMonth={currentMonth}
                    onChangeMonth={setCurrentMonth}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    busyDays={busyDays}
                  />
              }
            </div>
          </div>

          {/* Passo 4 — Horário */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              {loadingSlots
                ? <div className={styles.loadingBox}><div className={styles.spinner} /><span>Verificando horários...</span></div>
                : <TimeSlots
                    times={timeSlots}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                  />
              }
            </div>
          </div>

          {/* Passo 5 — Dados do cliente + Observações */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              <ClientForm
                name={clientName}
                phone={clientPhone}
                onChangeName={setClientName}
                onChangePhone={setClientPhone}
              />
              <Notes value={notes} onChange={setNotes} />
            </div>
          </div>

          {/* Passo 6 — Resumo + Confirmar */}
          <div className={styles.step}>
            <div className={styles.stepContent}>
              {confirmState === 'success' ? (
                <div className={styles.successBox}>
                  <span className={styles.successIcon}>✓</span>
                  <p className={styles.successTitle}>Agendamento Confirmado!</p>
                  <p className={styles.successMsg}>
                    Seu horário foi reservado com sucesso e adicionado ao calendário
                    de {selectedBarber?.name}. Até lá!
                  </p>
                </div>
              ) : (
                <>
                  <Summary
                    services={selectedServiceNames}
                    barber={selectedBarber?.name}
                    date={formattedDate}
                    time={selectedTime || 'Selecione'}
                    price={totalPrice}
                    duration={totalDuration}
                  />
                  {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
                  <div className={styles.confirmArea}>
                    <button
                      className={`${styles.confirmBtn} ${confirmState === 'success' ? styles.confirmBtnSuccess : ''}`}
                      onClick={handleConfirm}
                      disabled={confirmState === 'loading' || confirmState === 'success'}
                    >
                      {confirmState === 'loading' ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Barra de navegação — passos 1 a 5 */}
        {step < TOTAL_STEPS && (
          <div className={styles.navBar}>
            <div className={styles.navRow}>
              {step > 1 && (
                <button className={styles.btnBack} onClick={goBack}>VOLTAR</button>
              )}
              <button
                className={styles.btnPrimary}
                onClick={goNext}
                disabled={!canAdvance}
              >
                {step === 5 ? 'VER RESUMO' : 'PRÓXIMO'}
              </button>
            </div>
          </div>
        )}

        {/* Barra de navegação — passo 6 */}
        {step === TOTAL_STEPS && confirmState !== 'success' && (
          <div className={styles.navBar}>
            <button className={styles.btnBack} style={{ width: '100%' }} onClick={goBack}>
              VOLTAR E EDITAR
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
