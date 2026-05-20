import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@clexpay.com' } });
    if (!user) return NextResponse.json({ exists: false, message: 'User not found' });

    const storedValid = verifyPassword('Clexpay@2024', user.passwordHash);

    const roundtripHash = hashPassword('Clexpay@2024');
    await prisma.user.update({
      where: { email: 'admin@clexpay.com' },
      data: { passwordHash: roundtripHash },
    });
    const reread = await prisma.user.findUnique({ where: { email: 'admin@clexpay.com' } });
    const roundtripValid = verifyPassword('Clexpay@2024', reread!.passwordHash);

    return NextResponse.json({
      exists: true,
      email: user.email,
      storedHashPrefix: user.passwordHash.substring(0, 30),
      storedHashLength: user.passwordHash.length,
      storedHashValid: storedValid,
      roundtripHashPrefix: roundtripHash.substring(0, 30),
      roundtripHashLength: roundtripHash.length,
      roundtripValid,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    await prisma.user.update({
      where: { email: 'admin@clexpay.com' },
      data: { passwordHash: hashPassword('Clexpay@2024'), role: 'super_admin', emailVerified: true, status: 'active' },
    });
    await prisma.user.update({
      where: { email: 'john.doe@example.com' },
      data: { passwordHash: hashPassword('Demo@1234'), role: 'user', emailVerified: true, status: 'active' },
    });
    return NextResponse.json({ success: true, message: 'Passwords reset. Try logging in now.' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
