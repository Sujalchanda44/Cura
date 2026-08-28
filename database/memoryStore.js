/**
 * HealthSync AI - In-Memory Database Store
 * Provides collection-based storage for zero-dependency local execution
 */

const crypto = require('crypto');

class MemoryStore {
  constructor() {
    this.collections = {
      users: new Map(),
      healthProfiles: new Map(),
      nutritionLogs: new Map(),
      healthMetrics: new Map(),
      notifications: new Map(),
      reports: new Map(),
      refreshTokens: new Set()
    };
  }

  generateId() {
    return crypto.randomUUID();
  }

  // Generic collection operations
  async find(collectionName, query = {}) {
    const col = this.collections[collectionName];
    if (!col) return [];

    let items = Array.from(col.values());

    if (Object.keys(query).length > 0) {
      items = items.filter(item => {
        return Object.entries(query).every(([key, val]) => {
          if (val === undefined) return true;
          return item[key] === val;
        });
      });
    }

    return items.map(item => JSON.parse(JSON.stringify(item)));
  }

  async findById(collectionName, id) {
    const col = this.collections[collectionName];
    if (!col || !id) return null;
    const item = col.get(id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async findOne(collectionName, query = {}) {
    const items = await this.find(collectionName, query);
    return items.length > 0 ? items[0] : null;
  }

  async create(collectionName, data) {
    const col = this.collections[collectionName];
    if (!col) throw new Error(`Collection '${collectionName}' does not exist.`);

    const id = data.id || data._id || this.generateId();
    const now = new Date().toISOString();

    const record = {
      _id: id,
      id,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    col.set(id, record);
    return JSON.parse(JSON.stringify(record));
  }

  async update(collectionName, id, updateData) {
    const col = this.collections[collectionName];
    if (!col || !id || !col.has(id)) return null;

    const existing = col.get(id);
    const updated = {
      ...existing,
      ...updateData,
      id,
      _id: id,
      updatedAt: new Date().toISOString()
    };

    col.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async delete(collectionName, id) {
    const col = this.collections[collectionName];
    if (!col || !id) return false;
    return col.delete(id);
  }

  async count(collectionName, query = {}) {
    const items = await this.find(collectionName, query);
    return items.length;
  }

  // Refresh token whitelist/blacklist helper
  async storeRefreshToken(token) {
    this.collections.refreshTokens.add(token);
    return true;
  }

  async isRefreshTokenValid(token) {
    return this.collections.refreshTokens.has(token);
  }

  async revokeRefreshToken(token) {
    return this.collections.refreshTokens.delete(token);
  }

  // Reset/Clear store
  clear() {
    Object.keys(this.collections).forEach(key => {
      if (this.collections[key] instanceof Map) {
        this.collections[key].clear();
      } else if (this.collections[key] instanceof Set) {
        this.collections[key].clear();
      }
    });
  }
}

// Global Singleton Instance
const memoryDb = new MemoryStore();
module.exports = memoryDb;
