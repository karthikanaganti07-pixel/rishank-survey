// WhatsApp OTP Gateway Configuration
// This enables switching between local simulation and actual real-world WhatsApp dispatches.

export const defaultWhatsappConfig = {
  // Provider selection: 'mock' | 'greenapi'
  provider: 'mock', 

  // Green-API configuration (Free developer tier allows 100 messages/day to any number)
  // Sign up at https://green-api.com to get your credentials
  greenApi: {
    idInstance: '',       // E.g., '1101234567'
    apiTokenInstance: ''  // E.g., 'abcdef1234567890...'
  }
};
