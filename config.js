const { existsSync } = require("fs");
if (existsSync('config.env')) require('dotenv').config({ path: './config.env' });

module.exports = {
    PORT: process.env.PORT || 3000,
    BASE_URL: process.env.BASE_URL || "http://localhost:3000"
};