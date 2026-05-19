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
    const newHash = await bcrypt.hash('Clexpay@2024', 12);
    const testFreshCompare = await bcrypt.compare('Clexpay@2024', newHash);

    return NextResponse.json({
      exists: true,
      email: user.email,
      storedHashPrefix: hashPrefix,
      storedHashLength: hashLength,
      storedHashValid: isValid,
      freshHash: newHash,
      freshHashValid: testFreshCompare,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const newHash = await bcrypt.hash('Clexpay@2024', 12);
    await prisma.user.updateMany({
      where: { email: 'admin@clexpay.com' },
      data: { passwordHash: newHash, role: 'super_admin', emailVerified: true, status: 'active' },
    });
    await prisma.user.updateMany({
      where: { email: 'john.doe@example.com' },
      data: { passwordHash: await bcrypt.hash('Demo@1234', 12), role: 'user', emailVerified: true, status: 'active' },
    });
    return NextResponse.json({ success: true, message: 'Passwords reset. Try logging in now.' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
