import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@clexpay.com' } });
    if (!user) return NextResponse.json({ exists: false, message: 'User not found' });

    const hashPrefix = user.passwordHash.substring(0, 30);
    const hashLength = user.passwordHash.length;
    const isValid = await bcrypt.compare('Clexpay@2024', user.passwordHash);

    return NextResponse.json({
      exists: true,
      email: user.email,
      hashPrefix,
      hashLength,
      isValid,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
