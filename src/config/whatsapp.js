// WhatsApp OTP Gateway Configuration
// This enables switching between local simulation and actual real-world WhatsApp dispatches.

export const defaultWhatsappConfig = {
  // Provider selection: 'mock' | 'greenapi'
  provider: 'greenapi', 

  // Green-API configuration (Free developer tier allows 100 messages/day to any number)
  // Sign up at https://green-api.com to get your credentials
  greenApi: {
    idInstance: '710701667205',       // E.g., '1101234567'
    apiTokenInstance: 'b690c46ede4e49fc85d8ad8634847c7ad46d24c38f0d48d5a5'  // E.g., 'abcdef1234567890...'
  }
};
