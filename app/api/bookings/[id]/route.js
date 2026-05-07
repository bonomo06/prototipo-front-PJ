import { supabaseAdmin } from '@/lib/supabase';
import { deleteCalendarEvent } from '@/lib/google-calendar';
import { normalizePhone } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'phone é obrigatório' }, { status: 400 });
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_date, booking_time, total_price, total_duration, service_ids, notes, status, client_phone, client_name, barber_id, barbers(name)')
    .eq('id', id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  if (normalizePhone(booking.client_phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  let serviceNames = [];
  if (booking.service_ids?.length) {
    const { data: services } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .in('id', booking.service_ids);
    const map = Object.fromEntries((services || []).map(s => [s.id, s.name]));
    serviceNames = booking.service_ids.map(sid => map[sid] || 'Serviço');
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      total_price: booking.total_price,
      total_duration: booking.total_duration,
      notes: booking.notes,
      status: booking.status,
      client_name: booking.client_name,
      barber_name: booking.barbers?.name,
      service_names: serviceNames,
    },
  });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { phone } = body;
  if (!phone) {
    return NextResponse.json({ error: 'phone é obrigatório' }, { status: 400 });
  }

  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('id, client_phone, google_event_id, barber_id, status')
    .eq('id', id)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
  }

  if (normalizePhone(booking.client_phone) !== normalizePhone(phone)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Agendamento já cancelado' }, { status: 400 });
  }

  // Remover evento do Google Calendar (não bloqueia se já foi apagado lá)
  if (booking.google_event_id && booking.barber_id) {
    try {
      const { data: barber } = await supabaseAdmin
        .from('barbers')
        .select('google_calendar_id')
        .eq('id', booking.barber_id)
        .single();

      if (barber?.google_calendar_id) {
        await deleteCalendarEvent(barber.google_calendar_id, booking.google_event_id);
      }
    } catch (err) {
      console.error('[cancel] google calendar', err);
    }
  }

  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: 'Erro ao cancelar agendamento' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
