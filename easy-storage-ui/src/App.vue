<script setup>
import { useAuth } from './composables/useAuth';
import { useRouter } from 'vue-router';

const { isAuthenticated, logout } = useAuth();
const router = useRouter();

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<template>
  <div class="container">
    <header class="main-header">
      <div class="brand">🗄️ Media Archiver</div>
      <div v-if="isAuthenticated" class="nav-controls">
        <button @click="handleLogout" class="btn-secondary btn-sm">Cerrar Sesión</button>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Estilos base (puedes reutilizar los globales que te pasé antes) */
:root { --primary: #2563eb; --bg: #f3f4f6; }
body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: #1f2937; }
.container { max-width: 1000px; margin: 0 auto; padding: 1rem; }
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
.brand { font-size: 1.5rem; font-weight: bold; }
.btn-secondary { background: white; border: 1px solid #ccc; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
</style>