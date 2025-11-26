<script setup>
import { ref, computed } from 'vue';
import api from '../services/api';

const form = ref({
  url: '',
  description: '',
  tags: ''
});

const status = ref({
  loading: false,
  error: null,
  jobId: null,
  jobStatus: null,
  jobResult: null
});

// Validación simple
const isValid = computed(() => form.value.url.trim().length > 0);

const handleSubmit = async () => {
  if (!isValid.value) return;

  status.value.loading = true;
  status.value.error = null;
  status.value.jobId = null;
  status.value.jobResult = null;

  try {
    // Transformar tags de string "tag1, tag2" a array ["tag1", "tag2"]
    const tagsArray = form.value.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      url: form.value.url,
      description: form.value.description,
      tags: tagsArray
    };

    const response = await api.submitJob(payload);
    status.value.jobId = response.job_id;
    status.value.jobStatus = response.status;
    
    // Limpiar formulario tras envío exitoso
    form.value.url = ''; 
    form.value.description = '';
    form.value.tags = '';
  } catch (err) {
    status.value.error = err.message;
  } finally {
    status.value.loading = false;
  }
};

const checkStatus = async () => {
  if (!status.value.jobId) return;
  
  try {
    const res = await api.getJobStatus(status.value.jobId);
    status.value.jobStatus = res.status;
    if (res.status === 'finished') {
      status.value.jobResult = res.result;
    } else if (res.status === 'failed') {
      status.value.error = `El job falló: ${res.exc_info || 'Error desconocido'}`;
    }
  } catch (err) {
    status.value.error = "Error consultando estado: " + err.message;
  }
};
</script>

<template>
  <div class="card">
    <h2>📥 Agregar Media</h2>
    
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="field">
        <label>Tweet URL *</label>
        <input 
          v-model="form.url" 
          type="url" 
          placeholder="https://x.com/usuario/status/..." 
          required
        />
      </div>

      <div class="field">
        <label>Descripción</label>
        <textarea 
          v-model="form.description" 
          placeholder="Ej: Diego jugando contra Brasil"
          rows="3"
        ></textarea>
      </div>

      <div class="field">
        <label>Tags (separados por coma)</label>
        <input 
          v-model="form.tags" 
          type="text" 
          placeholder="futbol, archivo, viral"
        />
      </div>

      <button :disabled="status.loading || !isValid" class="btn-primary">
        {{ status.loading ? 'Enviando...' : 'Guardar' }}
      </button>
      
      <p v-if="status.error" class="error-msg">{{ status.error }}</p>
    </form>

    <div v-if="status.jobId" class="job-status-panel">
      <div class="status-header">
        <span>Job ID: <code>{{ status.jobId }}</code></span>
        <span :class="['badge', status.jobStatus]">{{ status.jobStatus }}</span>
      </div>
      
      <div v-if="status.jobResult" class="success-msg">
        ✅ Procesado. Items guardados: {{ status.jobResult.items ? status.jobResult.items.length : 0 }}
      </div>

      <button @click="checkStatus" class="btn-secondary btn-sm">
        🔄 Actualizar Estado
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos del componente */
.form-grid { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }
.job-status-panel { margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; }
.status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.badge { padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.85em; font-weight: bold; text-transform: uppercase; }
.badge.queued { background: #ffecb3; color: #664d03; }
.badge.started { background: #cff4fc; color: #055160; }
.badge.finished { background: #d1e7dd; color: #0f5132; }
.badge.failed { background: #f8d7da; color: #842029; }
</style>