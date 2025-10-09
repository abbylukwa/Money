class PaymentProcessor {
    constructor() {
        this.paymentInfo = {
            zimbabwe: {
                network: 'Econet',
                number: '0777627210',
                name: 'Your Name',
                methods: ['EcoCash', 'OneMoney'],
                exchangeRate: 350
            },
            southafrica: {
                network: 'Telekom', 
                number: '+27 61 415 9817',
                name: 'Your Name',
                methods: ['Telekom Payments'],
                exchangeRate: 18
            }
        };

        this.pendingPayments = new Map();
    }

    calculateLocalPrices(usdPrice) {
        return {
            zimbabwe: (usdPrice * this.paymentInfo.zimbabwe.exchangeRate).toFixed(2),
            southafrica: (usdPrice * this.paymentInfo.southafrica.exchangeRate).toFixed(2)
        };
    }

    async processSubscription(plan, from) {
        const orderId = 'SUB' + Date.now();
        const localPrices = this.calculateLocalPrices(plan.price);

        this.pendingPayments.set(orderId, {
            user: from,
            plan: plan,
            timestamp: new Date()
        });

        const paymentMsg = `🛍️ *SUBSCRIPTION ORDER*\n\n` +
                           `*Plan:* ${plan.name}\n` +
                           `*Price:* ${plan.currency} ${plan.price}\n` +
                           `*Duration:* ${plan.duration} days\n` +
                           `*Downloads:* ${plan.downloads}\n\n` +
                           `💳 *LOCAL PAYMENT AMOUNTS:*\n\n` +
                           `🇿🇼 *Zimbabwe (Econet):*\n` +
                           `📱 *Number:* ${this.paymentInfo.zimbabwe.number}\n` +
                           `💰 *Amount:* ZWL ${localPrices.zimbabwe}\n` +
                           `👤 *Name:* ${this.paymentInfo.zimbabwe.name}\n\n` +
                           `🇿🇦 *South Africa (Telekom):*\n` +
                           `📱 *Number:* ${this.paymentInfo.southafrica.number}\n` +
                           `💰 *Amount:* ZAR ${localPrices.southafrica}\n` +
                           `👤 *Name:* ${this.paymentInfo.southafrica.name}\n\n` +
                           `📋 *Order ID:* ${orderId}\n\n` +
                           `After payment, send:\n` +
                           `*.confirm ${orderId}*`;

        await this.sock.sendMessage(from, { text: paymentMsg });
        return orderId;
    }

    async showPaymentMethods(from) {
        const paymentMsg = `💳 *PAYMENT INFORMATION*\n\n` +
                          `🇿🇼 *ZIMBABWE (Econet):*\n` +
                          `📱 *Number:* ${this.paymentInfo.zimbabwe.number}\n` +
                          `👤 *Name:* ${this.paymentInfo.zimbabwe.name}\n` +
                          `💰 *Methods:* ${this.paymentInfo.zimbabwe.methods.join(', ')}\n\n` +
                          `🇿🇦 *SOUTH AFRICA (Telekom):*\n` +
                          `📱 *Number:* ${this.paymentInfo.southafrica.number}\n` +
                          `👤 *Name:* ${this.paymentInfo.southafrica.name}\n` +
                          `💰 *Methods:* ${this.paymentInfo.southafrica.methods.join(', ')}\n\n` +
                          `💱 *Exchange Rates:*\n` +
                          `$1 = ZWL ${this.paymentInfo.zimbabwe.exchangeRate}\n` +
                          `$1 = ZAR ${this.paymentInfo.southafrica.exchangeRate}`;

        await this.sock.sendMessage(from, { text: paymentMsg });
    }

    async confirmPayment(text, from, userManager, subscriptionManager) {
        const orderId = text.replace('.confirm ', '').trim();
        const payment = this.pendingPayments.get(orderId);

        if (!payment) {
            await this.sock.sendMessage(from, { 
                text: "❌ Order not found" 
            });
            return;
        }

        const subscription = subscriptionManager.createSubscription(payment.plan);
        userManager.activateSubscription(from, subscription);
        
        this.pendingPayments.delete(orderId);

        const confirmationMsg = `✅ *SUBSCRIPTION ACTIVATED!*\n\n` +
                               `*Plan:* ${payment.plan.name}\n` +
                               `*Price:* ${payment.plan.currency} ${payment.plan.price}\n` +
                               `*Duration:* ${payment.plan.duration} days\n` +
                               `*Expires:* ${new Date(subscription.expiry).toLocaleDateString()}\n\n` +
                               `🎉 You now have unlimited downloads!\n\n` +
                               `📥 *Start downloading:*\n` +
                               `.download [your search query]`;

        await this.sock.sendMessage(from, { text: confirmationMsg });
    }

    getStats() {
        return {
            pendingPayments: this.pendingPayments.size,
            paymentMethods: Object.keys(this.paymentInfo).length
        };
    }
}

module.exports = PaymentProcessor;