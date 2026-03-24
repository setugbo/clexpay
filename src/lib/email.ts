export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  console.log(`[EMAIL] Sending OTP ${otp} to ${email}`);
}

export async function sendTransactionEmail(email: string, details: {
  type: string;
  amount: string;
  reference: string;
}): Promise<void> {
  console.log(`[EMAIL] Transaction notification to ${email}:`, details);
}
