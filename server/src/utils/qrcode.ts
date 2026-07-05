import QRCode from 'qrcode';

export const generateBookingQR = async (bookingId: string, userId: string, lotId: string): Promise<string> => {
  try {
    const data = JSON.stringify({ bookingId, userId, lotId });
    // Returns a base64 encoded image string
    const qrDataURL = await QRCode.toDataURL(data);
    return qrDataURL;
  } catch (error) {
    console.error('Failed to generate QR code', error);
    throw new Error('QR Code generation failed');
  }
};
