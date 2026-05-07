import { supabaseAdmin } from '@/lib/supabase';
import { createCalendarEvent, getEventsForDay } from '@/lib/google-calendar';
import { buildTimeSlots } from '@/lib/time-slots';
import { NextResponse } from 'next/server';

function pad(n) { return String(n).padStart(2, '0'); }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'phone é obrigatório' }, { status: 400 });
  }

  const nowUTC  = new Date();
  const nowBR   = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
  const todayBR = nowBR.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_date, booking_time, total_price, total_duration, service_ids, notes, barber_id, barbers(name)')
    .eq('client_phone', phone)
    .neq('status', 'cancelled')
    .gte('booking_date', todayBR)
    .order('booking_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
  }

  const serviceIds = [...new Set((data || []).flatMap(b => b.service_ids))];
  let servicesMap = {};
  if (serviceIds.length) {
    const { data: services } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .in('id', serviceIds);
    servicesMap = Object.fromEntries((services || []).map(s => [s.id, s.name]));
  }

  const bookings = (data || []).map(b => ({
    id: b.id,
    booking_date: b.booking_date,
    booking_time: b.booking_time,
    total_price: b.total_price,
    total_duration: b.total_duration,
    notes: b.notes,
    barber_id: b.barber_id,
    barber_name: b.barbers?.name,
    service_ids: b.service_ids,
    service_names: b.service_ids.map(id => servicesMap[id] || 'Serviço'),
  }));

  return NextResponse.json({ bookings });
}

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

  // Rejeitar agendamentos no passado (fuso Brasil UTC-3)
  const bookingDateTime = new Date(`${date}T${time}:00-03:00`);
  if (bookingDateTime <= new Date()) {
    return NextResponse.json({ error: 'Não é possível agendar em horários já passados' }, { status: 400 });
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
