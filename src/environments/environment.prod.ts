export const environment = {
  production: true,
  apiBaseUrl: 'https://api.yourapp.com/api/v1/',
  wsUrl: 'wss://api.yourapp.com/ws',
  rtc: {
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
  }
};

