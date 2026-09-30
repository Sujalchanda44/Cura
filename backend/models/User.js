/**
 * User Model & Data Access Layer
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const memoryDb = require('../database/memoryStore');
const { ROLES } = require('../config/constants');
const config = require('../config/env');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../services/supabaseService');
const logger = require('../utils/logger');

const db = supabaseAdmin || supabase;

class User {
  static async findById(id) {
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error) return data || null;
        logger.error('Supabase findById error:', error);
      } catch (err) {
        logger.error('Supabase findById exception:', err);
      }
      return null;
    }
    return memoryDb.findById('users', id);
  }

  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (!error) return data || null;
        logger.error('Supabase findByEmail error:', error);
      } catch (err) {
        logger.error('Supabase findByEmail exception:', err);
      }
      return null;
    }
    return memoryDb.findOne('users', { email: cleanEmail });
  }

  static async findByGoogleId(googleId) {
    if (!googleId) return null;
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('users')
          .select('*')
          .eq('googleId', googleId)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        logger.error('Supabase findByGoogleId error:', err);
      }
      return null;
    }
    return memoryDb.findOne('users', { googleId });
  }

  static async findByResetToken(token) {
    if (!token) return null;
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
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
        logger.error('Supabase findByResetToken error:', err);
      }
      return null;
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

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name || 'User').trim();

    let authUserId = id;

    // 1. When Supabase is configured and we don't have an auth user ID yet,
    // ensure the user is registered in Supabase Auth (auth.users) so they appear in Supabase dashboard
    if (isSupabaseConfigured && supabaseAdmin && !authUserId) {
      try {
        const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: password || 'TempPass@2026',
          email_confirm: true,
          user_metadata: {
            name: cleanName,
            full_name: cleanName,
            role
          }
        });
        if (authCreated?.user?.id) {
          authUserId = authCreated.user.id;
        } else if (authErr) {
          logger.warn('Supabase Admin createUser note:', authErr.message);
        }
      } catch (err) {
        logger.warn('Supabase Admin createUser exception:', err.message);
      }
    }

    const finalId = authUserId || crypto.randomUUID();

    const payload = {
      id: finalId,
      name: cleanName,
      email: cleanEmail,
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
    if (isSupabaseConfigured && db) {
      try {
        const { data, error } = await db
          .from('users')
          .upsert([payload], { onConflict: 'id' })
          .select()
          .single();
        if (!error && data) {
          createdUser = data;
        } else if (error) {
          logger.error('Supabase user create error:', error);
          throw error;
        }
      } catch (err) {
        logger.error('Supabase create exception:', err);
        throw err;
      }
    } else {
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

    if (isSupabaseConfigured && db) {
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

        const { data, error } = await db
          .from('users')
          .update(supabasePayload)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          return { ...sanitized, ...data };
        }
        if (error) logger.error('Supabase user update failed:', error);
      } catch (err) {
        logger.error('Supabase update error:', err);
      }
      return null;
    }
    return memoryDb.update('users', id, sanitized);
  }

  static async delete(id) {
    if (isSupabaseConfigured && db) {
      try {
        // Cascade delete in Supabase
        await db.from('health_profiles').delete().eq('userId', id);
        const { error } = await db.from('users').delete().eq('id', id);
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});
        }
        return !error;
      } catch (err) {
        logger.error('Supabase delete error:', err);
        return false;
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
    if (isSupabaseConfigured && db) {
      try {
        let query = db.from('users').select('*', { count: 'exact' });
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
        logger.error('Supabase getAll error:', err);
      }
      return { users: [], total: 0 };
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
    return {
      ...safeUser,
      isOnboarded: safeUser.isOnboarded !== undefined 
        ? Boolean(safeUser.isOnboarded) 
        : !!safeUser.settings?.isOnboarded
    };
  }
}

module.exports = User;
