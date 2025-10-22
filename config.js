const toBool = (x) => x == 'true'
const { existsSync } = require("fs")
const { Sequelize } = require("sequelize");
if (existsSync('config.env')) require('dotenv').config({ path: './config.env' })
process.env.NODE_OPTIONS = '--max_old_space_size=2560'
const DB_URL = process.env.DATABASE_URL || '';

module.exports = {
    HEROKU: {
        API_KEY: process.env.HEROKU_API_KEY,
        APP_NAME: process.env.HEROKU_APP_NAME
    },
    PORT: process.env.PORT || 8080,
    BASE_URL: process.env.BASE_URL || "https://your-bot.onrender.com/",
    API_KEY: process.env.API_KEY || "L5Ce7iyZng",
    REPO: process.env.REPO || "your-username/your-bot",
    BGM_URL: process.env.BGM_URL || "null",
    ANTI_CALL: process.env.ANTI_CALL || 'false',
    ALLWAYS_ONLINE: toBool(process.env.ALLWAYS_ONLINE || "false"),
    PM_BLOCK: process.env.PM_BLOCK || "false",
    BGMBOT: toBool(process.env.BGMBOT || "false"),
    STATUS_VIEW: process.env.STATUS_VIEW || "false",
    SAVE_STATUS: toBool(process.env.SAVE_STATUS || "false"),
    DISABLE_PM: toBool(process.env.DISABLE_PM || "false"),
    DISABLE_GRP: toBool(process.env.DISABLE_GRP || "false"),
    ERROR_MSG: toBool(process.env.ERROR_MSG || "true"),
    AJOIN: toBool(process.env.AJOIN || 'false'),
    READ: process.env.READ || "false",
    CHATBOT: process.env.CHATBOT || "false",
    REACT: process.env.REACT || "false",
    WARNCOUNT: process.env.WARNCOUNT || 5,
    BOT_INFO: process.env.BOT_INFO || "WhatsBixby;Bot;https://example.com/image.jpg",
    WORKTYPE: process.env.WORKTYPE || "public",
    PREFIX: process.env.PREFIX || "[.,!]",
    PERSONAL_MESSAGE: process.env.PERSONAL_MESSAGE || "null",
    BOT_PRESENCE: process.env.BOT_PRESENCE || "unavailable",
    AUDIO_DATA: process.env.AUDIO_DATA || "WhatsBixby;Bot;https://example.com/image.jpg",
    STICKER_DATA: process.env.STICKER_DATA || "WhatsBixby;Bot",
    LIST_TYPE: process.env.LIST_TYPE || 'poll',
    LINK_PREVIEW: process.env.LINK_PREVIEW || 'WhatsBixby;Bot;https://example.com/image.jpg',
    API_TYPE: process.env.API_TYPE || 'all',
    BRAINSHOP: process.env.BRAINSHOP || '172372,nbjE0YAlyw3cpoMl',
    SUDO: process.env.SUDO || "919446072492",
    RMBG_KEY: process.env.RMBG_KEY,
    OPEN_AI: process.env.OPEN_AI,
    ELEVENLABS: process.env.ELEVENLABS || "",
    OCR_KEY: (process.env.OCR_KEY || 'K84003107488957').trim(),
    LANGUAGE: process.env.LANGUAGE || 'english',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    SEARCH_ENGINE_ID: process.env.SEARCH_ENGINE_ID || '',
    APP_URL: process.env.APP_URL || 'http://localhost:8080',
    
    PHONE_AUTH: toBool(process.env.PHONE_AUTH || "true"),
    BOT_PHONE_NUMBER: process.env.BOT_PHONE_NUMBER || "263777627210",
    
    DATABASE: DB_URL ? new Sequelize(DB_URL, {
        dialect: 'postgres',
        ssl: true,
        protocol: 'postgres',
        dialectOptions: {
            native: true,
            ssl: { require: true, rejectUnauthorized: false }
        },
        logging: false
    }) : new Sequelize({
        dialect: 'sqlite',
        storage: './database.db',
        logging: false
    })
};