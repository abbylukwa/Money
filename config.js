require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    SESSION_ID: process.env.SESSION_ID || "ABBY_WHATSAPP_BOT",
    ADMINS: ['263717457592@s.whatsapp.net', '263777627210@s.whatsapp.net', '27614159817@s.whatsapp.net']
};