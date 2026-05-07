import { google } from 'googleapis';

const TZ = 'America/Sao_Paulo';

function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Lista eventos de um dia específico no calendário do barbeiro.
 * @param {string} dateStr  "YYYY-MM-DD"
 * @param {string} calendarId  ID do Google Calendar do barbeiro
 */
export async function getEventsForDay(dateStr, calendarId) {
  const calendar = getCalendarClient();
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd   = new Date(`${dateStr}T23:59:59`);

  const res = await calendar.events.list({
    calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    timeZone: TZ,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items || []).map(ev => ({
    start:  ev.start.dateTime || ev.start.date,
    end:    ev.end.dateTime   || ev.end.date,
    allDay: !ev.start.dateTime,
  }));
}

/**
 * Lista eventos de um mês inteiro no calendário do barbeiro.
 * @param {number} year
 * @param {number} month  1-based
 * @param {string} calendarId
 * @returns {Map<string, number>}  Map<'YYYY-MM-DD', contagem>
 */
export async function getEventCountsByMonth(year, month, calendarId) {
  const calendar = getCalendarClient();
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0, 23, 59, 59);

  const res = await calendar.events.list({
    calendarId,
    timeMin: firstDay.toISOString(),
    timeMax: lastDay.toISOString(),
    timeZone: TZ,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const counts = new Map();
  for (const ev of res.data.items || []) {
    const dateStr = (ev.start.dateTime || ev.start.date).slice(0, 10);
    counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
  }
  return counts;
}

/**
 * Remove evento do calendário do barbeiro.
 * @param {string} calendarId
 * @param {string} eventId
 */
export async function deleteCalendarEvent(calendarId, eventId) {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId, eventId });
}

/**
 * Cria evento no calendário do barbeiro.
 * @param {string} calendarId
 * @param {{ summary, description, start, end }} params  start/end: "YYYY-MM-DDTHH:MM:00"
 * @returns {string} ID do evento criado
 */
export async function createCalendarEvent(calendarId, { summary, description, start, end }) {
  const calendar = getCalendarClient();
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: start, timeZone: TZ },
      end:   { dateTime: end,   timeZone: TZ },
    },
  });
  return res.data.id;
}
