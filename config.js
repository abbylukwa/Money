const dotenv = require('dotenv');
dotenv.config();

const defaultOwner = '263777627210';
const ownervb = process.env.OWNERS || process.env.OWNER_NUMBER || '';
const ownerlist = ownervb.split(';');

global.owner = [];
for (let i = 0; i < ownerlist.length; i++) {
    global.owner.push([ownerlist[i], true]);
}

global.botname = process.env.BOTNAME || 'AUTOBOB';
global.mods = [];
global.prems = [];
global.allowed = ['263777627210'];
global.keysZens = ['c2459db922', '37CC845916', '6fb0eff124'];
global.keysxxx = global.keysZens[Math.floor(global.keysZens.length * Math.random())];
global.keysxteammm = [
  '29d4b59a4aa687ca',
  '5LTV57azwaid7dXfz5fzJu',
  'cb15ed422c71a2fb',
  '5bd33b276d41d6b4',
  'HIRO',
  'kurrxd09',
  'ebb6251cc00f9c63',
];
global.keysxteam = global.keysxteammm[Math.floor(global.keysxteammm.length * Math.random())];
global.keysneoxrrr = ['5VC9rvNx', 'cfALv5'];
global.keysneoxr = global.keysneoxrrr[Math.floor(global.keysneoxrrr.length * Math.random())];
global.lolkeysapi = ['GataDios'];
global.canal = 'https://whatsapp.com';

global.APIs = {
  xteam: 'https://api.xteam.xyz',
  dzx: 'https://api.dhamzxploit.my.id',
  lol: 'https://api.lolhuman.xyz',
  violetics: 'https://violetics.pw',
  neoxr: 'https://api.neoxr.my.id',
  zenzapis: 'https://zenzapis.xyz',
  akuari: 'https://api.akuari.my.id',
  akuari2: 'https://apimu.my.id',
  nrtm: 'https://fg-nrtm.ddns.net',
  bg: 'http://bochil.ddns.net',
  fgmods: 'https://api.fgmods.xyz',
};

global.APIKeys = {
  'https://api.xteam.xyz': 'd90a9e986e18778b',
  'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
  'https://api.neoxr.my.id': `${global.keysneoxr}`,
  'https://violetics.pw': 'beta',
  'https://zenzapis.xyz': `${global.keysxxx}`,
  'https://api.fgmods.xyz': 'm2XBbNvz',
};

global.premium = 'true';
global.packname = 'AUTOBOB';
global.author = 'BobbyX208';
global.menuvid = 'https://i.imgur.com/2U2K9YA.mp4';
global.igfg = ' Follow on Instagram\nhttps://www.instagram.com/bobbyvic23';
global.dygp = 'https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07';
global.fgsc = 'https://github.com/BobbyX208/AUTOBOB';
global.fgyt = 'https://youtube.com/@BobbyX208';
global.fgpyp = 'https://youtube.com/@BobbyX208';
global.fglog = 'https://i.ibb.co/G2dh9cB/qasim.jpg';

// Remove the problematic file read - set thumb to null or empty
global.thumb = null;

global.wait = '⏳';
global.rwait = '⏳';
global.dmoji = '🤭';
global.done = '✅';
global.error = '❌';
global.xmoji = '🤩';

global.multiplier = 69;
global.maxwarn = '3';

module.exports = {
  PORT: process.env.PORT || 3000,
  ADMINS: global.owner.map(([number]) => number + '@s.whatsapp.net'),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  BOT_NUMBER: process.env.BOT_NUMBER || '263777627210',
  OWNERS: global.owner
};
