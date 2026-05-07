import { supabaseAdmin } from '@/lib/supabase';
import { getEventsForDay } from '@/lib/google-calendar';
import { buildTimeSlots } from '@/lib/time-slots';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date     = searchParams.get('date');                    // "YYYY-MM-DD"
  const duration = parseInt(searchParams.get('duration'), 10); // minutos
  const barberId = parseInt(searchParams.get('barberId'), 10);

  if (!date || !duration || !barberId) {
    return NextResponse.json({ error: 'date, duration e barberId são obrigatórios' }, { status: 400 });
  }

  // Buscar o calendar_id do barbeiro
  const { data: barber, error: barberErr } = await supabaseAdmin
    .from('barbers')
    .select('google_calendar_id')
    .eq('id', barberId)
    .single();

  // Calcular nowMinutes quando a data solicitada é hoje (fuso Brasil UTC-3)
  const nowUTC  = new Date();
  const nowBR   = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
  const todayBR = nowBR.toISOString().slice(0, 10);
  const nowMinutes = date === todayBR
    ? nowBR.getUTCHours() * 60 + nowBR.getUTCMinutes()
    : null;

  if (barberErr || !barber?.google_calendar_id) {
    const slots = buildTimeSlots(duration, [], nowMinutes);
    return NextResponse.json({ slots });
  }

  try {
    const events = await getEventsForDay(date, barber.google_calendar_id);
    const slots  = buildTimeSlots(duration, events, nowMinutes);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('[timeslots]', err);
    return NextResponse.json({ error: 'Erro ao consultar horários' }, { status: 500 });
  }
}
