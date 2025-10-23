const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class KeepAlive {
    constructor() {
        this.pingInterval = null;
        this.statusFile = path.join(__dirname, '..', 'data', 'bot_status.json');
        this.ensureStatusFile();
    }

    async ensureStatusFile() {
        try {
            await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
            try {
                await fs.access(this.statusFile);
            } catch {
                await fs.writeFile(this.statusFile, JSON.stringify({
                    lastPing: new Date().toISOString(),
                    totalPings: 0,
                    status: 'offline',
                    lastUpdate: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Error ensuring status file:', error);
        }
    }

    async updateStatus(status, additionalData = {}) {
        try {
            let data;
            try {
                data = JSON.parse(await fs.readFile(this.statusFile, 'utf8'));
            } catch {
                data = { totalPings: 0 };
            }
            
            data.status = status;
            data.lastUpdate = new Date().toISOString();
            Object.assign(data, additionalData);
            
            await fs.writeFile(this.statusFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async getStatus() {
        try {
            return JSON.parse(await fs.readFile(this.statusFile, 'utf8'));
        } catch (error) {
            return { 
                status: 'offline', 
                lastPing: null, 
                totalPings: 0,
                lastUpdate: new Date().toISOString()
            };
        }
    }

    startPinging(url, interval = 60000) {
        console.log(`🔔 Starting keep-alive pings to ${url} every ${interval/1000}s...`);
        this.updateStatus('online');

        this.pingInterval = setInterval(async () => {
            try {
                const response = await axios.get(url, { 
                    timeout: 10000,
                    validateStatus: function (status) {
                        return status < 500; // Resolve only if status code < 500
                    }
                });

                const data = await this.getStatus();
                data.lastPing = new Date().toISOString();
                data.totalPings = (data.totalPings || 0) + 1;
                data.status = 'online';
                data.lastResponseCode = response.status;

                await fs.writeFile(this.statusFile, JSON.stringify(data, null, 2));

                console.log(`✅ Keep-alive ping successful (Status: ${response.status})`);
            } catch (error) {
                console.error('❌ Keep-alive ping failed:', error.message);
                this.updateStatus('offline', { 
                    lastError: error.message,
                    lastErrorTime: new Date().toISOString()
                });
            }
        }, interval);
    }

    stopPinging() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.updateStatus('offline');
            console.log('🛑 Stopped keep-alive pings');
        }
    }

    async restartPinging(url, interval = 60000) {
        this.stopPinging();
        this.startPinging(url, interval);
    }
}

module.exports = KeepAlive;
