import { supabaseAdmin } from '@/lib/supabase';
import { createCalendarEvent, getEventsForDay } from '@/lib/google-calendar';
import { buildTimeSlots } from '@/lib/time-slots';
import { NextResponse } from 'next/server';

function pad(n) { return String(n).padStart(2, '0'); }

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const {
    serviceIds,
    serviceNames,
    barberId,
    clientName,
    clientPhone,
    date,
    time,
    totalDuration,
    totalPrice,
    notes,
  } = body;

  if (!serviceIds?.length || !barberId || !clientName || !clientPhone || !date || !time || !totalDuration) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
  }

  // Buscar calendar_id do barbeiro
  const { data: barber, error: barberErr } = await supabaseAdmin
    .from('barbers')
    .select('google_calendar_id, name')
    .eq('id', barberId)
    .single();

  if (barberErr || !barber) {
    return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
  }

  const calendarId = barber.google_calendar_id;

  // 1. Verificar disponibilidade em tempo real (previne race condition)
  if (calendarId) {
    try {
      const events = await getEventsForDay(date, calendarId);
      const slots  = buildTimeSlots(totalDuration, events);
      const slot   = slots.find(s => s.time === time);

      if (!slot || !slot.available) {
        return NextResponse.json(
          { error: 'Horário indisponível. Por favor, escolha outro horário.' },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error('[bookings] verificação de disponibilidade', err);
      return NextResponse.json({ error: 'Erro ao verificar disponibilidade' }, { status: 500 });
    }
  }

  // 2. Criar evento no Google Calendar do barbeiro
  let googleEventId = null;
  if (calendarId) {
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute]     = time.split(':').map(Number);

      const startDT = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
      const endDate = new Date(year, month - 1, day, hour, minute + totalDuration);
      const endDT   = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

      googleEventId = await createCalendarEvent(calendarId, {
        summary:     `[PJ] ${clientName} — ${(serviceNames || []).join(' + ')}`,
        description: `Barbeiro: ${barber.name}\nTel: ${clientPhone}\nServiços: ${(serviceNames || []).join(', ')}\nDuração: ${totalDuration}min\nObs: ${notes || 'Nenhuma'}`,
        start: startDT,
        end:   endDT,
      });
    } catch (err) {
      console.error('[bookings] google calendar', err);
      return NextResponse.json({ error: 'Erro ao criar evento no calendário' }, { status: 500 });
    }
  }

  // 3. Salvar no Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        service_ids:     serviceIds,
        barber_id:       barberId,
        client_name:     clientName,
        client_phone:    clientPhone,
        booking_date:    date,
        booking_time:    time,
        total_duration:  totalDuration,
        total_price:     totalPrice,
        notes:           notes || '',
        google_event_id: googleEventId,
        status:          'confirmed',
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, bookingId: data.id });
  } catch (err) {
    console.error('[bookings] supabase', err);
    return NextResponse.json({ error: 'Erro ao salvar agendamento' }, { status: 500 });
  }
}
