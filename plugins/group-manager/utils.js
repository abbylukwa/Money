const fs = require('fs');
const path = require('path');

function ensureDownloadDir() {
    const downloadDir = path.join(__dirname, '..', '..', 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }
}

function cleanupFile(filePath) {
    try {
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Cleaned up: ${path.basename(filePath)}`);
            }
        }, 30000);
    } catch (error) {
        console.log('❌ File cleanup error:', error);
    }
}

module.exports = {
    ensureDownloadDir,
    cleanupFile
};