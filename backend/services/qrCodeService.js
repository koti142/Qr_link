import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QR_CODES_DIR = path.join(__dirname, '../../qr-codes');

export async function generateQRCode(videoId, url) {
  try {
    await fs.mkdir(QR_CODES_DIR, { recursive: true });
    
    const qrCodePath = path.join(QR_CODES_DIR, `${videoId}.png`);
    
    await QRCode.toFile(qrCodePath, url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return `/qr-codes/${videoId}.png`;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
}

