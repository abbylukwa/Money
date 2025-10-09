class Scheduler {
    constructor() {
        this.intervals = [];
        this.timeouts = [];
    }

    scheduleDailyTask(hour, minute, task) {
        const now = new Date();
        const target = new Date();
        target.setHours(hour, minute, 0, 0);

        if (target <= now) target.setDate(target.getDate() + 1);

        const delay = target.getTime() - now.getTime();
        const timeout = setTimeout(() => {
            task();
            this.scheduleDailyTask(hour, minute, task);
        }, delay);

        this.timeouts.push(timeout);
    }

    scheduleInterval(task, interval) {
        task();
        const intervalId = setInterval(task, interval);
        this.intervals.push(intervalId);
    }

    stopAll() {
        this.intervals.forEach(clearInterval);
        this.timeouts.forEach(clearTimeout);
        this.intervals = [];
        this.timeouts = [];
    }

    getStats() {
        return {
            activeIntervals: this.intervals.length,
            activeTimeouts: this.timeouts.length
        };
    }
}

module.exports = Scheduler;