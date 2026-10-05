const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });
    return qrDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR Code');
  }
};

module.exports = { generateQRCode };
