export const environment = {
    production: true,
    apiBaseUrl: 'http://localhost:8080/api/v1/',
    wsUrl: 'http://localhost:8080/ws',
    googleClientId: '33227048330-96tb616sbhubg1nj6n2ploqa2euo8d0o.apps.googleusercontent.com',
    encryptionKey: '', // same as backend ENCRYPTION_SECRET
    rtc: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
    }
};

