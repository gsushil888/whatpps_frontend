export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080/ws',
    rtc: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] // add TURN in prod
    }
};
