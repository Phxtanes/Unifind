import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    async login(username, password) {
      const config = useRuntimeConfig();
      try {
        const response = await axios.post(`${config.public.apiBaseUrl}/auth/login`, { username, password });
        this.token = response.data.accessToken;
        this.user = { id: response.data.id, username: response.data.username };
        if (process.client) localStorage.setItem('token', this.token);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
        };
      }
    },
    async register(username, email, password) {
      const config = useRuntimeConfig();
      try {
        await axios.post(`${config.public.apiBaseUrl}/auth/register`, { username, email, password });
        return { success: true, message: 'สมัครสมาชิกสำเร็จ!' };
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'การสมัครสมาชิกล้มเหลว' 
        };
      }
    },
    bypassLogin() {
      this.token = 'bypass-token-12345';
      this.user = { id: 999, username: 'BypassUser' };
      if (process.client) localStorage.setItem('token', this.token);
    },
    logout() {
      this.user = null;
      this.token = null;
      if (process.client) localStorage.removeItem('token');
    },
    initAuth() {
      if (process.client) {
        const token = localStorage.getItem('token');
        if (token) this.token = token;
      }
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token
  }
});
