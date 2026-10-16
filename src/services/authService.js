import apiClient from './apiClient';

export const authService = {
  /**
   * Authenticate user against the server with real password verification
   */
  async login(identifier, password, hospitalId, forceReclaim = false) {
    if (!identifier || !password) {
      return {
        success: false,
        message: 'Email / Badge ID and password are required.',
      };
    }

    try {
      const res = await apiClient.post('/api/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
        hospitalId,
        forceReclaim: !!forceReclaim,
      });

      if (res && res.success && res.token && res.user) {
        this.persistSession(res.user, res.token);
        return { success: true, user: res.user, token: res.token, sessionId: res.sessionId };
      }

      return {
        success: false,
        code: res.code,
        message: res.message || 'Authentication failed. Please verify credentials.',
      };
    } catch (err) {
      return {
        success: false,
        code: err.data?.code,
        status: err.status,
        message: err.message || 'Server authentication failed. Please check network connection.',
      };
    }
  },

  /**
   * Provision the initial superintendent account for a hospital
   */
  async bootstrapSuperintendent({ hospitalId, hospitalName, name, email, password, badgeNumber }) {
    try {
      const res = await apiClient.post('/api/auth/bootstrap-superintendent', {
        hospitalId,
        hospitalName,
        name,
        email,
        password,
        badgeNumber,
      });

      if (res && res.success && res.token && res.user) {
        this.persistSession(res.user, res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Failed to provision superintendent.' };
    } catch (err) {
      return { success: false, message: err.message || 'Provisioning error.' };
    }
  },

  /**
   * Retrieve current authenticated user session
   */
  getCurrentUser() {
    try {
      const token = localStorage.getItem('medwaste_auth_token');
      const saved = localStorage.getItem('medwaste_user');
      if (token && saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    } catch {}
    return null;
  },

  getToken() {
    try {
      return localStorage.getItem('medwaste_auth_token');
    } catch {
      return null;
    }
  },

  persistSession(user, token) {
    try {
      if (user) {
        localStorage.setItem('medwaste_user', JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem('medwaste_auth_token', token);
      }
    } catch (err) {
      console.error('Session persistence failed:', err);
    }
  },

  async logout() {
    try {
      const user = this.getCurrentUser();
      const token = this.getToken();
      if (token) {
        await apiClient.post('/api/auth/logout', { email: user?.email }).catch(() => {});
      }
    } catch {}
    try {
      localStorage.removeItem('medwaste_user');
      localStorage.removeItem('medwaste_auth_token');
    } catch {}
  },

  async heartbeat() {
    try {
      return await apiClient.post('/api/auth/heartbeat');
    } catch (err) {
      return { success: false, code: err.data?.code, message: err.message };
    }
  },
};

export default authService;
