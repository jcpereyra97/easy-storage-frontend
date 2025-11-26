<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import api from '../services/api';

const props = defineProps({
  mediaId: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Imagen segura'
  }
});

const imageUrl = ref(null);
const loading = ref(true);
const error = ref(false);

const loadImage = async () => {
  loading.value = true;
  error.value = false;
  
  try {
    // 1. Pedimos los bytes al backend (con Auth Header)
    const blob = await api.getMediaContentBlob(props.mediaId);
    
    // 2. Creamos una URL local temporal (blob:http://localhost...)
    // Si ya había una imagen cargada antes, liberamos memoria
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
    
    imageUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error(`Fallo carga imagen ${props.mediaId}`, err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(loadImage);

// Si cambia el ID (ej: reciclaje de componentes), recargamos
watch(() => props.mediaId, loadImage);

// 3. LIMPIEZA DE MEMORIA (CRUCIAL EN SPA)
onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>

<template>
  <div class="secure-img-container">
    <div v-if="loading" class="skeleton"></div>

    <div v-else-if="error" class="error-placeholder">
      ⚠️ No disponible
    </div>

    <img 
      v-else 
      :src="imageUrl" 
      :alt="alt" 
      class="img-content"
    />
  </div>
</template>

<style scoped>
.secure-img-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.img-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.error-placeholder {
  font-size: 0.8rem;
  color: #888;
  padding: 1rem;
  text-align: center;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>