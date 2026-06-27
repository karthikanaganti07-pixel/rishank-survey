import { defaultWhatsappConfig } from '../config/whatsapp';

/**
 * Sends a real or simulated WhatsApp message to a customer containing the OTP.
 * @param {string} phoneNumber - 10-digit Indian phone number
 * @param {string} otpCode - 4-digit verification code
 * @returns {Promise<{success: boolean, provider: string, error?: string}>}
 */
export async function sendWhatsAppOtp(phoneNumber, otpCode) {
  // Load configuration from localStorage (so admin dashboard changes are reactive)
  const savedConfigStr = localStorage.getItem('rishank_whatsapp_config');
  let config = defaultWhatsappConfig;
  
  if (savedConfigStr) {
    try {
      config = JSON.parse(savedConfigStr);
    } catch (e) {
      console.error("Failed to parse WhatsApp config, using defaults", e);
    }
  }

  // Handle Mock simulation provider
  if (config.provider === 'mock') {
    return { success: true, provider: 'mock' };
  }

  // Handle Green-API provider (real WhatsApp delivery)
  if (config.provider === 'greenapi') {
    const { idInstance, apiTokenInstance } = config.greenApi || {};
    
    if (!idInstance || !apiTokenInstance) {
      return { 
        success: false, 
        provider: 'greenapi', 
        error: 'Green-API credentials are not configured in Admin Dashboard.' 
      };
    }

    try {
      // Formulating standard Indian contact address
      const chatId = `91${phoneNumber}@c.us`;
      const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
      
      const payload = {
        chatId: chatId,
        message: `🛰️ *Rishank Survey Solutions OTP* 🛰️\n\nYour digital verification security code is: *${otpCode}*\n\nValid for 5 minutes. Do not share this code. Securely sign in to continue.`
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      const result = await response.json();
      console.log("Green-API dispatch success:", result);
      return { success: true, provider: 'greenapi' };

    } catch (err) {
      console.error("Green-API dispatch failed:", err);
      return { 
        success: false, 
        provider: 'greenapi', 
        error: `WhatsApp Delivery Failed: ${err.message}. Falling back to simulation mode.` 
      };
    }
  }

  return { success: false, provider: 'unknown', error: 'Unknown API provider.' };
}
