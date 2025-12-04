import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QR_CODES_DIR = path.join(__dirname, '../../qr-codes');

/**
 * Generate QR code for a video
 */
export async function generateQRCode(videoId, redirectUrl) {
  try {
    await ensureDirectoryExists(QR_CODES_DIR);
    
    const qrPath = path.join(QR_CODES_DIR, `${videoId}.png`);
    
    await QRCode.toFile(qrPath, redirectUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512
    });
    
    return `/qr-codes/${videoId}.png`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Get QR code file path
 */
export function getQRCodePath(videoId) {
  return path.join(QR_CODES_DIR, `${videoId}.png`);
}

/**
 * Download QR code as file (for API endpoint)
 */
export async function downloadQRCode(videoId) {
  const qrPath = getQRCodePath(videoId);
  try {
    // Check if file exists
    await fs.access(qrPath);
    const qrBuffer = await fs.readFile(qrPath);
    if (!qrBuffer || qrBuffer.length === 0) {
      throw new Error('QR code file is empty');
    }
    return qrBuffer;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`QR code file not found: ${qrPath}`);
      throw new Error('QR code file not found');
    }
    console.error('Error reading QR code file:', error);
    throw new Error(`Failed to read QR code: ${error.message}`);
  }
}





