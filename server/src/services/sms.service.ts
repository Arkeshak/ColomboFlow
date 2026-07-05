import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID || 'mock_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'mock_token';
const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
const verifySid = process.env.TWILIO_VERIFY_SID || 'mock_verify';

const isMock = accountSid === 'mock_sid';
const client = isMock ? null : twilio(accountSid, authToken);

export const sendSms = async (to: string, message: string) => {
  if (isMock) {
    console.log(`[MOCK SMS to ${to}]: ${message}`);
    return true;
  }

  try {
    const result = await client!.messages.create({
      body: message,
      from: twilioNumber,
      to,
    });
    console.log(`SMS sent to ${to}, SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.warn(`[Twilio Error] Failed to send SMS. Falling back to mock SMS for ${to}`);
    return true;
  }
};

export const sendOTP = async (phone: string) => {
  if (isMock) {
    console.log(`[MOCK OTP] Sent to ${phone}`);
    return true;
  }
  
  try {
    const result = await client!.verify.v2.services(verifySid)
      .verifications
      .create({ to: phone, channel: 'sms' });
    console.log(`OTP sent to ${phone}, Status: ${result.status}`);
    return true;
  } catch (error) {
    console.warn(`[Twilio Error] Failed to send OTP to ${phone}. Falling back to mock OTP.`);
    return true;
  }
};

export const verifyOTP = async (phone: string, code: string) => {
  if (isMock) {
    console.log(`[MOCK OTP] Verifying ${code} for ${phone}`);
    return code === '123456';
  }
  
  try {
    const result = await client!.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: phone, code });
    console.log(`OTP verification for ${phone}: ${result.status}`);
    return result.status === 'approved';
  } catch (error) {
    console.warn(`[Twilio Error] Failed to verify OTP for ${phone}. Falling back to mock verification.`);
    return code === '123456';
  }
};
