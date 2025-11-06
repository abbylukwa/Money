const terminalLogs = [];

function logToTerminal(message) {
    const logEntry = {
        id: terminalLogs.length + 1,
        message: message,
        timestamp: new Date()
    };
    terminalLogs.push(logEntry);
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    
    if (terminalLogs.length > 50) {
        terminalLogs.shift();
    }
}

function getTerminalLogs() {
    return terminalLogs;
}

module.exports = { logToTerminal, getTerminalLogs };
