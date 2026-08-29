/**
 * User Model & Data Access Layer
 */

const bcrypt = require('bcryptjs');
const memoryDb = require('../database/memoryStore');
const { ROLES } = require('../config/constants');
const config = require('../config/env');
const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

class User {
  static async findById(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findById error, falling back:', err);
      }
    }
    return memoryDb.findById('users', id);
  }

  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByEmail error, falling back:', err);
      }
    }
    return memoryDb.findOne('users', { email: cleanEmail });
  }

  static async findByGoogleId(googleId) {
    if (!googleId) return null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('googleId', googleId)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByGoogleId error, falling back:', err);
      }
    }
    return memoryDb.findOne('users', { googleId });
  }

  static async findByResetToken(token) {
    if (!token) return null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('resetPasswordToken', token)
          .maybeSingle();
        if (!error && data) {
          if (data.resetPasswordExpires && new Date(data.resetPasswordExpires) < new Date()) {
            return null; // Expired token
          }
          return data;
        }
      } catch (err) {
        logger.error('Supabase findByResetToken error, falling back:', err);
      }
    }
    const user = await memoryDb.findOne('users', { resetPasswordToken: token });
    if (!user) return null;
    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return null;
    }
    return user;
  }

  static async create({
    id = null,
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

    const payload = {
      id: id || memoryDb.generateId(),
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
    };

    let createdUser = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([payload])
          .select()
          .single();
        if (!error && data) {
          // Sync with local memoryDb
          await memoryDb.create('users', data);
          createdUser = data;
        }
        if (error) logger.error('Supabase user create error:', error);
      } catch (err) {
        logger.error('Supabase create error, falling back:', err);
      }
    }

    if (!createdUser) {
      createdUser = await memoryDb.create('users', payload);
    }

    // Automatically create default Health Profile after registration
    try {
      const HealthProfile = require('./HealthProfile');
      await HealthProfile.createOrUpdate(createdUser.id, { isOnboarded: false });
    } catch (profileError) {
      logger.error('Error auto-creating health profile:', profileError);
    }

    return createdUser;
  }

  static async update(id, updateData) {
    const sanitized = { ...updateData };
    if (sanitized.password) {
      sanitized.password = await bcrypt.hash(sanitized.password, config.security.saltRounds);
    }
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }

    if (isSupabaseConfigured) {
      try {
        const allowedSupabaseColumns = [
          'id', 'name', 'email', 'password', 'role', 
          'avatarUrl', 'googleId', 'settings', 'isVerified', 
          'createdAt', 'updatedAt'
        ];
        const supabasePayload = {};
        Object.keys(sanitized).forEach(key => {
          if (allowedSupabaseColumns.includes(key)) {
            supabasePayload[key] = sanitized[key];
          }
        });

        const { data, error } = await supabase
          .from('users')
          .update(supabasePayload)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          // Sync with local memoryDb
          await memoryDb.update('users', id, sanitized);
          return { ...sanitized, ...data };
        }
        if (error) logger.error('Supabase user update failed, falling back:', error);
      } catch (err) {
        logger.error('Supabase update error, falling back:', err);
      }
    }
    return memoryDb.update('users', id, sanitized);
  }

  static async delete(id) {
    if (isSupabaseConfigured) {
      try {
        // Cascade delete profile in Supabase
        await supabase.from('health_profiles').delete().eq('userId', id);
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (!error) {
          const profile = await memoryDb.findOne('healthProfiles', { userId: id });
          if (profile) await memoryDb.delete('healthProfiles', profile.id);
          return memoryDb.delete('users', id);
        }
      } catch (err) {
        logger.error('Supabase delete error, falling back:', err);
      }
    }
    const profile = await memoryDb.findOne('healthProfiles', { userId: id });
    if (profile) await memoryDb.delete('healthProfiles', profile.id);
    return memoryDb.delete('users', id);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(page = 1, limit = 10, search = '') {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('users').select('*', { count: 'exact' });
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        const start = (page - 1) * limit;
        const { data, count, error } = await query.range(start, start + limit - 1);
        if (!error && data) {
          const sanitized = data.map(u => {
            const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = u;
            return safeUser;
          });
          return {
            users: sanitized,
            total: count || sanitized.length
          };
        }
      } catch (err) {
        logger.error('Supabase getAll error, falling back:', err);
      }
    }

    let allUsers = await memoryDb.find('users');

    if (search) {
      const q = search.toLowerCase();
      allUsers = allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

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
