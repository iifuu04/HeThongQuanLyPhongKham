/**
 * Profile Service (BUS Layer)
 * Business logic for Profile/Account operations
 * SRS UC18 - User Management
 * SRS UC19 - Role-based Access Control
 */

import ProfileRepository from './Profile.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';
import bcrypt from 'bcrypt';
import { normalizeDate } from '../../utils/date.js';

const VALID_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'];

/**
 * Remove password_hash from profile object
 */
function sanitizeProfile(profile) {
    if (!profile) return null;
    const { password_hash, ...sanitized } = profile;
    return sanitized;
}

/**
 * Sanitize array of profiles
 */
function sanitizeProfiles(profiles) {
    if (!profiles || !Array.isArray(profiles)) return [];
    return profiles.map(sanitizeProfile);
}

class ProfileService {
    /**
     * Get all profiles (without password_hash)
     */
    async getAllProfiles() {
        const profiles = await ProfileRepository.getProfiles();
        return sanitizeProfiles(profiles);
    }

    /**
     * Get profile by ID (without password_hash)
     */
    async getProfileById(id) {
        const profile = await ProfileRepository.getUserById(id);
        return sanitizeProfile(profile);
    }

    /**
     * Get profile by username (without password_hash)
     */
    async getProfileByUsername(username) {
        const profile = await ProfileRepository.getUserByUsername(username);
        return sanitizeProfile(profile);
    }

    /**
     * Get profiles by role (without password_hash)
     */
    async getProfilesByRole(role) {
        // Validate role
        if (!VALID_ROLES.includes(role)) {
            return { success: false, message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` };
        }
        const profiles = await ProfileRepository.getProfilesByRole(role);
        return sanitizeProfiles(profiles);
    }

    /**
     * Create new profile
     * Only ADMIN can create profiles
     */
    async createProfile(data, actorId) {
        try {
            // Validate required fields
            const required = ['username', 'password', 'role', 'first_name', 'last_name'];
            for (const field of required) {
                if (!data[field]) {
                    return { success: false, message: `Missing required field: ${field}` };
                }
            }

            // Validate role
            if (!VALID_ROLES.includes(data.role)) {
                return { success: false, message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` };
            }

            // Check username uniqueness
            const existing = await ProfileRepository.getUserByUsername(data.username);
            if (existing) {
                return { success: false, message: 'Username already exists' };
            }

            // Hash password with bcrypt
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(data.password, saltRounds);

            // Create profile
            const result = await ProfileRepository.createProfile({
                username: data.username,
                password_hash,
                role: data.role,
                first_name: data.first_name,
                last_name: data.last_name,
                date_of_birth: normalizeDate(data.date_of_birth),
                gender: data.gender || null,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null
            });

            if (result) {
                // Get the created profile
                const profiles = await ProfileRepository.getProfiles();
                const created = profiles[profiles.length - 1];
                
                // Create audit log
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'CREATE',
                        table_name: 'Profiles',
                        record_id: created.id,
                        description: `Created user: ${created.username} with role ${created.role}`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, data: sanitizeProfile(created) };
            }

            return { success: false, message: 'Failed to create profile' };
        } catch (error) {
            console.error('Error creating profile:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update profile
     * Users can update their own profile, admins can update anyone
     */
    async updateProfile(id, data, actorId) {
        try {
            // Check if profile exists
            const existing = await ProfileRepository.getUserById(id);
            if (!existing) {
                return { success: false, message: 'Profile not found' };
            }

            // Validate role if provided
            if (data.role && !VALID_ROLES.includes(data.role)) {
                return { success: false, message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` };
            }

            // If updating username, check uniqueness
            if (data.username && data.username !== existing.username) {
                const usernameExists = await ProfileRepository.getUserByUsername(data.username);
                if (usernameExists) {
                    return { success: false, message: 'Username already exists' };
                }
            }

            // Prepare update data
            const updateData = {};
            const allowedFields = ['username', 'first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone', 'address'];
            
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    // Normalize date fields
                    if (field === 'date_of_birth') {
                        updateData[field] = normalizeDate(data[field]);
                    } else {
                        updateData[field] = data[field];
                    }
                }
            }

            // If updating password, hash it
            if (data.password) {
                const saltRounds = 10;
                updateData.password_hash = await bcrypt.hash(data.password, saltRounds);
            }

            // Check if there's anything to update
            if (Object.keys(updateData).length === 0) {
                return { success: false, message: 'No fields to update' };
            }

            const result = await ProfileRepository.updateProfile(id, updateData);
            
            if (result) {
                const updated = await ProfileRepository.getUserById(id);
                
                // Create audit log
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'UPDATE',
                        table_name: 'Profiles',
                        record_id: parseInt(id),
                        description: `Updated user: ${updated.username}`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, data: sanitizeProfile(updated) };
            }
            return { success: false, message: 'Failed to update profile' };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update profile role
     * Only ADMIN can update roles
     */
    async updateProfileRole(id, role, actorId) {
        try {
            // Validate role
            if (!VALID_ROLES.includes(role)) {
                return { success: false, message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` };
            }

            // Check if profile exists
            const existing = await ProfileRepository.getUserById(id);
            if (!existing) {
                return { success: false, message: 'Profile not found' };
            }

            const result = await ProfileRepository.updateProfileRole(id, role);
            
            if (result) {
                const updated = await ProfileRepository.getUserById(id);
                
                // Create audit log
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'UPDATE',
                        table_name: 'Profiles',
                        record_id: parseInt(id),
                        description: `Changed role of ${updated.username} from ${existing.role} to ${role}`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, data: sanitizeProfile(updated) };
            }
            return { success: false, message: 'Failed to update profile role' };
        } catch (error) {
            console.error('Error updating profile role:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Toggle profile lock status (lock/unlock)
     * Only ADMIN can toggle status
     */
    async toggleProfileStatus(id, actorId) {
        try {
            const profile = await ProfileRepository.getUserById(id);
            if (!profile) {
                return { success: false, message: 'Profile not found' };
            }

            let result;
            let action;
            
            if (profile.is_deleted === 1) {
                // Account is locked, unlock it
                result = await ProfileRepository.unlockProfile(id);
                action = 'unlocked';
            } else {
                // Account is active, lock it
                result = await ProfileRepository.lockProfile(id);
                action = 'locked';
            }

            if (result) {
                const updated = await ProfileRepository.getUserById(id);
                
                // Create audit log
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'UPDATE',
                        table_name: 'Profiles',
                        record_id: parseInt(id),
                        description: `${action} account: ${updated.username}`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, data: sanitizeProfile(updated) };
            }
            return { success: false, message: 'Failed to update profile status' };
        } catch (error) {
            console.error('Error toggling profile status:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Soft delete profile
     * Only ADMIN can delete profiles
     */
    async deleteProfile(id, actorId) {
        try {
            const profile = await ProfileRepository.getUserById(id);
            if (!profile) {
                return { success: false, message: 'Profile not found' };
            }

            const result = await ProfileRepository.deleteProfile(id);
            
            if (result) {
                // Create audit log
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'DELETE',
                        table_name: 'Profiles',
                        record_id: parseInt(id),
                        description: `Deleted user: ${profile.username}`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, message: 'Profile deleted' };
            }
            return { success: false, message: 'Failed to delete profile' };
        } catch (error) {
            console.error('Error deleting profile:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new ProfileService();
