import { supabaseAdmin } from '@/lib/supabase';
import { deleteCalendarEvent } from '@/lib/google-calendar';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { id } = params;

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

  if (booking.client_phone !== phone) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Agendamento já cancelado' }, { status: 400 });
  }

  // Remover evento do Google Calendar (não bloqueia cancelamento se falhar)
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
