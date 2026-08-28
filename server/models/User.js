/**
 * User Model & Data Access Layer
 */

const bcrypt = require('bcryptjs');
const memoryDb = require('../../database/memoryStore');
const { ROLES } = require('../config/constants');
const config = require('../config/env');

class User {
  static async findById(id) {
    return memoryDb.findById('users', id);
  }

  static async findByEmail(email) {
    if (!email) return null;
    return memoryDb.findOne('users', { email: email.toLowerCase().trim() });
  }

  static async findByGoogleId(googleId) {
    if (!googleId) return null;
    return memoryDb.findOne('users', { googleId });
  }

  static async findByResetToken(token) {
    if (!token) return null;
    const user = await memoryDb.findOne('users', { resetPasswordToken: token });
    if (!user) return null;
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return null; // Expired token
    }
    return user;
  }

  static async create({
    name,
    email,
    password,
    role = ROLES.USER,
    avatarUrl = null,
    googleId = null,
    settings = {}
  }) {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, config.security.saltRounds);
    }

    return memoryDb.create('users', {
      name: (name || 'User').trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      avatarUrl,
      googleId,
      settings: {
        theme: 'dark',
        notificationsEnabled: true,
        unitSystem: 'metric',
        ...settings
      },
      isVerified: true
    });
  }

  static async update(id, updateData) {
    const sanitized = { ...updateData };
    if (sanitized.password) {
      sanitized.password = await bcrypt.hash(sanitized.password, config.security.saltRounds);
    }
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }
    return memoryDb.update('users', id, sanitized);
  }

  static async delete(id) {
    // Cascade delete related profile and logs
    const profile = await memoryDb.findOne('healthProfiles', { userId: id });
    if (profile) await memoryDb.delete('healthProfiles', profile.id);
    return memoryDb.delete('users', id);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(page = 1, limit = 10, search = '') {
    let allUsers = await memoryDb.find('users');

    if (search) {
      const q = search.toLowerCase();
      allUsers = allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    // Exclude password field from list
    const sanitized = allUsers.map(u => {
      const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = u;
      return safeUser;
    });

    const start = (page - 1) * limit;
    const paginated = sanitized.slice(start, start + limit);

    return {
      users: paginated,
      total: sanitized.length
    };
  }

  static toSafeObject(user) {
    if (!user) return null;
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = User;
