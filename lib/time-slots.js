const WORK_START_H = 7;
const WORK_START_M = 30;
const WORK_END_H   = 20;
const WORK_END_M   = 0;
const SLOT_INTERVAL = 30; // minutos

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Gera todos os horários de início possíveis para um serviço de `durationMinutes`.
 * Slots de 30 em 30 min, garantindo que slotStart + duration ≤ 20:00.
 */
export function generateAllSlots(durationMinutes) {
  const workStart = WORK_START_H * 60 + WORK_START_M;
  const workEnd   = WORK_END_H   * 60 + WORK_END_M;
  const slots = [];
  for (let t = workStart; t + durationMinutes <= workEnd; t += SLOT_INTERVAL) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

/**
 * Verifica se o slot [slotStartMin, slotStartMin + duration] colide com algum evento.
 * Eventos all-day (allDay: true) bloqueiam o slot incondicionalmente.
 */
function collidesWithEvents(slotStartMin, durationMinutes, events) {
  const slotEndMin = slotStartMin + durationMinutes;

  for (const ev of events) {
    if (ev.allDay) return true;

    // Extrai HH:MM do ISO string (ex: "2026-05-06T09:30:00-03:00" → "09:30")
    const evStartStr = ev.start.length > 10 ? ev.start.slice(11, 16) : null;
    const evEndStr   = ev.end.length   > 10 ? ev.end.slice(11, 16)   : null;
    if (!evStartStr || !evEndStr) continue;

    const evStartMin = toMinutes(evStartStr);
    const evEndMin   = toMinutes(evEndStr);

    // Interseção de intervalos: colide se NÃO (slot termina antes do ev ou começa depois)
    if (!(slotEndMin <= evStartMin || slotStartMin >= evEndMin)) {
      return true;
    }
  }
  return false;
}

/**
 * Retorna os slots do dia com flag de disponibilidade.
 * @param {number} durationMinutes
 * @param {Array<{start: string, end: string, allDay: boolean}>} events
 * @param {number|null} nowMinutes  minutos desde meia-noite do horário atual (para bloquear passados)
 * @returns {Array<{time: string, available: boolean}>}
 */
export function buildTimeSlots(durationMinutes, events, nowMinutes = null) {
  return generateAllSlots(durationMinutes).map(time => ({
    time,
    available:
      (nowMinutes === null || toMinutes(time) > nowMinutes) &&
      !collidesWithEvents(toMinutes(time), durationMinutes, events),
  }));
}
