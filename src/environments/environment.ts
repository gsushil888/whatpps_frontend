export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api/v1/',
    wsUrl: 'http://localhost:8080/ws',
    googleClientId: '33227048330-96tb616sbhubg1nj6n2ploqa2euo8d0o.apps.googleusercontent.com',
    rtc: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] // add TURN in prod
    }
};

