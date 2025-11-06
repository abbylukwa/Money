const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

class MongoConnectionManager {
  constructor() {
    this.clients = new Map();
    this.defaultUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
  }

  async getClient(uri = this.defaultUri) {
    if (!this.clients.has(uri)) {
      const client = new MongoClient(uri);
      try {
        await client.connect();
        console.log(`Connected to MongoDB at ${uri.split('@').pop()}`);
        this.clients.set(uri, client);
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        throw error;
      }
    }
    return this.clients.get(uri);
  }

  async getDb(dbName, uri = this.defaultUri) {
    const client = await this.getClient(uri);
    return client.db(dbName);
  }

  async closeConnection(uri = this.defaultUri) {
    const client = this.clients.get(uri);
    if (client) {
      try {
        await client.close();
        this.clients.delete(uri);
        console.log(`Closed MongoDB connection to ${uri.split('@').pop()}`);
        return true;
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
      }
    }
    return false;
  }

  async closeAllConnections() {
    const promises = [];
    for (const [uri, client] of this.clients.entries()) {
      promises.push(this.closeConnection(uri));
    }
    await Promise.all(promises);
  }
}

const mongoConnectionManager = new MongoConnectionManager();
module.exports = mongoConnectionManager;
