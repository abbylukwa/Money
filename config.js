require('dotenv').config();

// Use environment session ID or generate a default one
const generateDefaultSessionId = () => {
    return 'ABBY_' + Math.random().toString(36).substring(2, 15);
};

module.exports = {
    PORT: process.env.PORT || 3000,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",
    SESSION_ID: process.env.SESSION_ID || generateDefaultSessionId(),
    ADMINS: ['263717457592@s.whatsapp.net', '263777627210@s.whatsapp.net', '27614159817@s.whatsapp.net']
};