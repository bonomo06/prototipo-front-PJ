"use client";

import { useMemo } from "react";
import styles from "./Calendar.module.css";

const MONTHS = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function Calendar({
  currentMonth,
  onChangeMonth,
  selectedDate,
  onSelectDate,
  busyDays,
}) {
  const { month, year } = currentMonth;

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ type: "empty", key: `e${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < today;
      const isSunday = dateObj.getDay() === 0;
      const isToday = dateObj.getTime() === today.getTime();
      const isBusy = busyDays.includes(d);
      const isSelected =
        selectedDate !== null &&
        selectedDate.day === d &&
        selectedDate.month === month &&
        selectedDate.year === year;

      let type = "free";
      if (isPast || isSunday) type = "past";
      else if (isBusy) type = "busy";

      cells.push({ type, day: d, isToday, isSelected, key: `d${d}` });
    }

    return cells;
  }, [month, year, busyDays, selectedDate]);

  const handlePrev = () => {
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
    if (isCurrentMonth) return; // não permite navegar para meses passados
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    onChangeMonth({ month: m, year: y });
  };

  const today = new Date();
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  const handleNext = () => {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    onChangeMonth({ month: m, year: y });
  };

  const handleSelect = (day) => {
    onSelectDate({ day, month, year });
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        Escolha a <span>Data</span>
      </h2>

      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={handlePrev} disabled={isCurrentMonth} aria-label="Mês anterior">
          &#8249;
        </button>
        <span className={styles.monthName}>
          {MONTHS[month]} {year}
        </span>
        <button className={styles.navBtn} onClick={handleNext}>
          &#8250;
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((w) => (
          <span key={w} className={styles.weekday}>
            {w}
          </span>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className={styles.empty} />;
          }

          const cls = [
            styles.day,
            cell.type === "past" && styles.past,
            cell.type === "busy" && styles.busy,
            cell.type === "free" && styles.free,
            cell.isSelected && styles.selectedDay,
            cell.isToday && styles.today,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.key}
              className={cls}
              disabled={cell.type === "past"}
              onClick={() => cell.type !== "past" && handleSelect(cell.day)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendFree}`} />
          Disponivel
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendBusy}`} />
          Lotado
        </div>
      </div>
    </section>
  );
}
