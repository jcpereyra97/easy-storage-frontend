<script setup>
import { ref } from 'vue';
import api from '../services/api';
import SecureImage from './SecureImage.vue'; // Importamos el componente seguro

const query = ref('');
const tagFilter = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref(null);
const hasSearched = ref(false);

const handleSearch = async () => {
  loading.value = true;
  error.value = null;
  results.value = [];
  
  try {
    const params = {
      limit: 20, // Límite por defecto
      offset: 0
    };
    if (query.value) params.q = query.value;
    if (tagFilter.value) params.tag = tagFilter.value;

    const data = await api.searchMedia(params);
    results.value = data;
    hasSearched.value = true;
  } catch (err) {
    error.value = "Error en búsqueda: " + err.message;
  } finally {
    loading.value = false;
  }
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString() + ' ' + new Date(isoString).toLocaleTimeString();
};
</script>

<template>
  <div class="card">
    <h2>🔎 Buscar Media</h2>
    
    <div class="search-bar">
      <input 
        v-model="query" 
        @keyup.enter="handleSearch"
        type="text" 
        placeholder="Buscar texto..." 
        class="input-grow"
      />
      <input 
        v-model="tagFilter" 
        @keyup.enter="handleSearch"
        type="text" 
        placeholder="Filtrar por tag" 
      />
      <button @click="handleSearch" :disabled="loading" class="btn-primary">
        {{ loading ? '...' : 'Buscar' }}
      </button>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div v-if="!loading && hasSearched && results.length === 0" class="no-results">
      No se encontraron resultados.
    </div>

    <div class="results-grid">
      <div v-for="item in results" :key="item.id" class="media-item">
        
        <div class="media-preview" v-if="item.type === 'image'">
          <SecureImage 
            :media-id="item.id" 
            :alt="item.description || 'Imagen archivada'" 
          />
        </div>

        <div class="media-preview video-placeholder" v-else-if="item.type === 'video'">
           <span>🎥 Video (Ver en Twitter/Drive)</span>
        </div>
        
        <div class="media-header">
          <span class="type-badge">{{ item.type }}</span>
          <span class="date">{{ formatDate(item.created_at) }}</span>
        </div>
        
        <h3 v-if="item.title">{{ item.title }}</h3>
        <p class="description">{{ item.description || 'Sin descripción' }}</p>
        
        <div class="tags-container">
          <span v-for="tag in item.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
        </div>

        <div class="actions">
          <a :href="item.source_url" target="_blank" rel="noopener" class="link-btn">
            Abrir Tweet ↗
          </a>
          <a v-if="item.storage_url" :href="item.storage_url" target="_blank" rel="noopener" class="link-btn drive">
            Ver en Drive ↗
          </a>
        </div>
        
        <div class="meta">
          <small>SHA: {{ item.sha256 ? item.sha256.substring(0, 8) : 'N/A' }}...</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.input-grow { flex-grow: 1; min-width: 200px; }

.results-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 1rem; 
}

.media-item { 
  border: 1px solid #ddd; 
  padding: 1rem; 
  border-radius: 8px; 
  background: white;
  display: flex; 
  flex-direction: column;
}

/* Estilos del Preview */
.media-preview {
  width: 100%;
  height: 200px; /* Altura fija para mantener la grilla ordenada */
  background-color: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
  background-color: #e9ecef;
  border: 2px dashed #ced4da;
}

/* Resto de estilos */
.media-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; color: #666; }
.type-badge { background: #eef; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #44a; text-transform: uppercase; }

.description { font-size: 0.95rem; margin-bottom: 1rem; flex-grow: 1; white-space: pre-wrap; }

.tags-container { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 1rem; }
.tag-chip { background: #eee; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; color: #555; }

.actions { display: flex; gap: 1rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #eee; }
.link-btn { text-decoration: none; color: #007bff; font-size: 0.9rem; font-weight: 500; cursor: pointer; }
.link-btn:hover { text-decoration: underline; }
.link-btn.drive { color: #198754; } /* Verde para Drive */

.meta { margin-top: 0.5rem; font-size: 0.75rem; color: #aaa; }
.no-results { text-align: center; color: #666; margin-top: 2rem; }
</style>