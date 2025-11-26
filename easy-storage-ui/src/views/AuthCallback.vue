<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const route = useRoute();
const { setAuth } = useAuth();

onMounted(() => {
  const token = route.query.token;
  const user = route.query.user;

  if (token) {
    setAuth(token, user);
    router.push('/'); // Redirigir al Home logueado
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div class="loading">Procesando autenticación...</div>
</template>

<style scoped>
.loading { text-align: center; margin-top: 5rem; font-size: 1.2rem; color: #666; }
</style>