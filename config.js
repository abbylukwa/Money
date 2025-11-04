require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    ADMINS: ['263717457592@s.whatsapp.net', '263777627210@s.whatsapp.net', '27614159817@s.whatsapp.net'],
    // QR Code settings
    QR_TIMEOUT: 60000, // 1 minute
    MAX_RECONNECTION_ATTEMPTS: 5
};
