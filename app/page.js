"use client";

import { useState, useCallback, useMemo } from "react";
import styles from "./page.module.css";
import Header from "./components/Header";
import ServicePicker from "./components/ServicePicker";
import Calendar from "./components/Calendar";
import TimeSlots from "./components/TimeSlots";
import Notes from "./components/Notes";
import Summary from "./components/Summary";

// =============================================
// API INTEGRATION (descomentar quando a API estiver pronta)
// =============================================
// const API_BASE = "https://sua-api.com/api/v1";
//
// async function fetchServices() {
//   const res = await fetch(`${API_BASE}/services`);
//   return res.json();
// }
//
// async function fetchAvailableDays(month, year) {
//   const res = await fetch(`${API_BASE}/availability?month=${month}&year=${year}`);
//   return res.json();
// }
//
// async function fetchAvailableTimes(date) {
//   const res = await fetch(`${API_BASE}/availability/${date}/times`);
//   return res.json();
// }
//
// async function createBooking(data) {
//   const res = await fetch(`${API_BASE}/bookings`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   return res.json();
// }
// =============================================

const SERVICES = [
  { id: 1, name: "Corte Degrade", price: 35, duration: 45, icon: "scissors" },
  { id: 2, name: "Barba Completa", price: 25, duration: 30, icon: "razor" },
  { id: 3, name: "Corte + Barba", price: 55, duration: 75, icon: "combo" },
  { id: 4, name: "Relaxamento", price: 40, duration: 50, icon: "relax" },
  { id: 5, name: "Coloracao", price: 80, duration: 90, icon: "color" },
  { id: 6, name: "Corte Infantil", price: 25, duration: 30, icon: "child" },
];

// Dados mock - substituir por dados da API
const BUSY_DAYS = [3, 7, 8, 14, 15, 21, 22, 28];

const MOCK_TIMES = [
  { time: "08:00", available: false },
  { time: "09:00", available: false },
  { time: "10:00", available: true },
  { time: "11:00", available: true },
  { time: "12:00", available: false },
  { time: "13:00", available: true },
  { time: "14:00", available: true },
  { time: "15:00", available: false },
  { time: "16:00", available: true },
  { time: "17:00", available: true },
  { time: "18:00", available: false },
  { time: "19:00", available: true },
];

export default function Home() {
  const [selectedServices, setSelectedServices] = useState([1]);
  const [selectedDate, setSelectedDate] = useState({ day: 10, month: 2, year: 2026 });
  const [selectedTime, setSelectedTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [confirmState, setConfirmState] = useState("idle");
  const [currentMonth, setCurrentMonth] = useState({ month: 2, year: 2026 });

  // =============================================
  // API INTEGRATION: substituir dados mock
  // =============================================
  // const [services, setServices] = useState([]);
  // const [busyDays, setBusyDays] = useState([]);
  // const [times, setTimes] = useState([]);
  //
  // useEffect(() => {
  //   fetchServices().then(setServices);
  // }, []);
  //
  // useEffect(() => {
  //   fetchAvailableDays(currentMonth.month + 1, currentMonth.year)
  //     .then(data => setBusyDays(data.busyDays));
  // }, [currentMonth]);
  //
  // useEffect(() => {
  //   if (selectedDate.day) {
  //     const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
  //     fetchAvailableTimes(dateStr).then(setTimes);
  //   }
  // }, [selectedDate]);
  // =============================================

  const toggleService = useCallback((id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, id) => {
      const svc = SERVICES.find((s) => s.id === id);
      return sum + (svc?.price || 0);
    }, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, id) => {
      const svc = SERVICES.find((s) => s.id === id);
      return sum + (svc?.duration || 0);
    }, 0);
  }, [selectedServices]);

  const selectedServiceNames = useMemo(() => {
    return selectedServices
      .map((id) => SERVICES.find((s) => s.id === id)?.name)
      .filter(Boolean);
  }, [selectedServices]);

  const handleConfirm = async () => {
    if (selectedServices.length === 0 || !selectedDate.day || !selectedTime) return;

    setConfirmState("loading");

    // =============================================
    // API INTEGRATION: enviar agendamento
    // =============================================
    // try {
    //   const bookingData = {
    //     services: selectedServices,
    //     date: `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`,
    //     time: selectedTime,
    //     notes,
    //   };
    //   const result = await createBooking(bookingData);
    //   if (!result.success) throw new Error(result.message);
    //   setConfirmState("success");
    // } catch (err) {
    //   console.error("Erro ao agendar:", err);
    //   setConfirmState("idle");
    //   return;
    // }
    // =============================================

    // Mock delay
    await new Promise((r) => setTimeout(r, 800));
    setConfirmState("success");
    setTimeout(() => setConfirmState("idle"), 3000);
  };

  const MONTHS = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const formattedDate = selectedDate.day
    ? `${selectedDate.day} de ${MONTHS[selectedDate.month]}`
    : "Selecione";

  const canConfirm = selectedServices.length > 0 && selectedDate.day && selectedTime;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Header />

        <ServicePicker
          services={SERVICES}
          selected={selectedServices}
          onToggle={toggleService}
        />

        <div className={styles.divider} />

        <Calendar
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          busyDays={BUSY_DAYS}
        />

        <div className={styles.divider} />

        <TimeSlots
          times={MOCK_TIMES}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
        />

        <div className={styles.divider} />

        <Notes value={notes} onChange={setNotes} />

        <Summary
          services={selectedServiceNames}
          date={formattedDate}
          time={selectedTime || "Selecione"}
          price={totalPrice}
          duration={totalDuration}
        />

        <div className={styles.ctaWrapper}>
          <button
            className={`${styles.ctaBtn} ${confirmState === "success" ? styles.ctaSuccess : ""} ${!canConfirm ? styles.ctaDisabled : ""}`}
            onClick={handleConfirm}
            disabled={!canConfirm || confirmState === "loading"}
          >
            {confirmState === "loading" && "AGENDANDO..."}
            {confirmState === "success" && "AGENDADO COM SUCESSO"}
            {confirmState === "idle" && "CONFIRMAR AGENDAMENTO"}
          </button>
        </div>
      </div>
    </main>
  );
}
