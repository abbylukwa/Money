class BroadcastManager {
    constructor(sock) {
        this.sock = sock;
        this.constantAdmins = [
            '0775156210@s.whatsapp.net',
            '27614159817@s.whatsapp.net', 
            '263717457592@s.whatsapp.net',
            '263777627210@s.whatsapp.net'
        ];
    }

    setupHandlers(joinedGroups) {
        this.joinedGroups = joinedGroups;
    }
}

module.exports = BroadcastManager;