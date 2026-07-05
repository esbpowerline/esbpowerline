import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, clientIpFromForwarded } from '@/lib/rate-limit';
import { checkCsrf } from '@/lib/security';

export async function POST(request: NextRequest) {
  const csrfDenied = checkCsrf(request);
  if (csrfDenied) return csrfDenied;

  // Rate limit: 5 submissions per minute per IP
  const ip = clientIpFromForwarded(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  );
  const rl = checkRateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body ?? {};

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    if (trimmedName.length > 200) {
      return NextResponse.json({ error: 'Name is too long.' }, { status: 400 });
    }
    if (trimmedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (trimmedMessage.length > 10_000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
    }
    if (subject && String(subject).trim().length > 300) {
      return NextResponse.json({ error: 'Subject is too long.' }, { status: 400 });
    }
    if (phone && String(phone).trim().length > 40) {
      return NextResponse.json({ error: 'Phone number is too long.' }, { status: 400 });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: trimmedMessage,
      },
    });

    return NextResponse.json({ success: true, id: contactMessage.id });
  } catch (error) {
    console.error('[contact] Failed to save message:', error);
    return NextResponse.json({ error: 'Could not save your message. Please try again.' }, { status: 500 });
  }
}
