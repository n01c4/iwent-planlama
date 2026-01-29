import { randomBytes, createHash } from 'crypto';
import QRCode from 'qrcode';

/**
 * Generate checksum for QR code validation
 */
function generateChecksum(input: string): string {
  return createHash('sha256')
    .update(input)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();
}

/**
 * Generate a unique QR code string for a ticket
 * Format: TICKET-{RANDOM16}-{CHECKSUM4}
 * Example: TICKET-A3B7C9D1E2F4G5H6-AB12
 */
export function generateTicketQRCode(ticketId: string): string {
  const random = randomBytes(8).toString('hex').toUpperCase();
  const checksum = generateChecksum(ticketId + random);
  return `TICKET-${random}-${checksum}`;
}

/**
 * Validate a ticket QR code format
 */
export function validateTicketQRCode(qrCode: string): boolean {
  const pattern = /^TICKET-[A-F0-9]{16}-[A-F0-9]{4}$/;
  return pattern.test(qrCode);
}

/**
 * Generate QR code as data URL (for rendering as image)
 */
export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 256,
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
  });
}
