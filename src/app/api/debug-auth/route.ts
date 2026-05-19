import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@clexpay.com' } });
    if (!user) return NextResponse.json({ exists: false, message: 'User not found' });

    const storedHash = user.passwordHash;
    const storedValid = await bcrypt.compare('Clexpay@2024', storedHash);

    const roundtripHash = await bcrypt.hash('Clexpay@2024', 12);
    await prisma.user.update({
      where: { email: 'admin@clexpay.com' },
      data: { passwordHash: roundtripHash },
    });
    const reread = await prisma.user.findUnique({ where: { email: 'admin@clexpay.com' } });
    const roundtripValid = await bcrypt.compare('Clexpay@2024', reread!.passwordHash);

    return NextResponse.json({
      exists: true,
      email: user.email,
      storedHashPrefix: storedHash.substring(0, 30),
      storedHashLength: storedHash.length,
      storedHashValid: storedValid,
      roundtripHashPrefix: roundtripHash.substring(0, 30),
      roundtripHashLength: roundtripHash.length,
      roundtripValid,
      hashesMatch: storedHash === roundtripHash,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const hash = await bcrypt.hash('Clexpay@2024', 12);
    await prisma.user.update({
      where: { email: 'admin@clexpay.com' },
      data: { passwordHash: hash, role: 'super_admin', emailVerified: true, status: 'active' },
    });
    await prisma.user.update({
      where: { email: 'john.doe@example.com' },
      data: { passwordHash: await bcrypt.hash('Demo@1234', 12), role: 'user', emailVerified: true, status: 'active' },
    });
    return NextResponse.json({ success: true, message: 'Passwords reset. Try logging in now.' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
