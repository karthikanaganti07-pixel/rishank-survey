// WhatsApp OTP Gateway Configuration
// This enables switching between local simulation and actual real-world WhatsApp dispatches.

export const defaultWhatsappConfig = {
  // Provider selection: 'mock' | 'greenapi'
  provider: 'greenapi', 

  // Green-API configuration (Free developer tier allows 100 messages/day to any number)
  // Sign up at https://green-api.com to get your credentials
  greenApi: {
    idInstance: '710701667392',       // E.g., '1101234567'
    apiTokenInstance: 'da88090712ff4e46940f4fe800014c28309a4c42b5e44d07b9'  // E.g., 'abcdef1234567890...'
  }
};
