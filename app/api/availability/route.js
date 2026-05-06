import { supabaseAdmin } from '@/lib/supabase';
import { getEventsForDay, getEventCountsByMonth } from '@/lib/google-calendar';
import { buildTimeSlots } from '@/lib/time-slots';
import { NextResponse } from 'next/server';

const TOTAL_SLOTS_PER_DAY = 25; // slots de 30min das 07:30 às 20:00

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month    = parseInt(searchParams.get('month'),    10); // 1-based
  const year     = parseInt(searchParams.get('year'),     10);
  const barberId = parseInt(searchParams.get('barberId'), 10);

  if (!month || !year || !barberId) {
    return NextResponse.json({ error: 'month, year e barberId são obrigatórios' }, { status: 400 });
  }

  // Buscar o calendar_id do barbeiro
  const { data: barber, error: barberErr } = await supabaseAdmin
    .from('barbers')
    .select('google_calendar_id')
    .eq('id', barberId)
    .single();

  if (barberErr || !barber?.google_calendar_id) {
    // Calendário ainda não configurado — nenhum dia lotado
    return NextResponse.json({ busyDays: [] });
  }

  const calendarId = barber.google_calendar_id;

  try {
    const counts = await getEventCountsByMonth(year, month, calendarId);
    const busyDays = [];

    for (const [dateStr, count] of counts) {
      if (count >= TOTAL_SLOTS_PER_DAY) {
        busyDays.push(parseInt(dateStr.slice(8, 10), 10));
        continue;
      }
      if (count > 0) {
        const events = await getEventsForDay(dateStr, calendarId);
        const slots  = buildTimeSlots(30, events);
        if (!slots.some(s => s.available)) {
          busyDays.push(parseInt(dateStr.slice(8, 10), 10));
        }
      }
    }

    return NextResponse.json({ busyDays });
  } catch (err) {
    console.error('[availability]', err);
    return NextResponse.json({ error: 'Erro ao consultar calendário' }, { status: 500 });
  }
}
