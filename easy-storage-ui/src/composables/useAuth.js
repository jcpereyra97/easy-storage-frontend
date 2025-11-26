// src/composables/useAuth.js
import { ref, computed } from 'vue';

const token = ref(localStorage.getItem('access_token') || null);
const userId = ref(localStorage.getItem('user_id') || null);

export function useAuth() {
  
  const setAuth = (newToken, newUser) => {
    token.value = newToken;
    userId.value = newUser;
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_id', newUser);
  };

  const logout = () => {
    token.value = null;
    userId.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    window.location.reload(); // Recarga limpia para reiniciar estado
  };

  const isAuthenticated = computed(() => !!token.value);

  return {
    token,
    userId,
    isAuthenticated,
    setAuth,
    logout
  };
}