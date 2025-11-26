<script setup>
import api from '../services/api';

const handleLogin = async () => {
  try {
    const res = await api.startGoogleAuth();
    // El backend nos da la URL de Google, redirigimos al usuario ahí
    window.location.href = res.authorization_url;
  } catch (err) {
    alert("Error conectando con el servidor: " + err.message);
  }
};
</script>

<template>
  <div class="login-container">
    <div class="card login-card">
      <h1>🔐 Acceso Requerido</h1>
      <p>Para archivar media, necesitas conectar tu Google Drive.</p>
      <button @click="handleLogin" class="btn-primary google-btn">
        Continuar con Google
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 80vh; }
.login-card { text-align: center; max-width: 400px; }
.google-btn { background-color: #4285F4; margin-top: 1rem; }
.google-btn:hover { background-color: #357ae8; }
</style>