<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// Auto-polling
const pollIntervalId = ref(null);
const timerIntervalId = ref(null);
const elapsedTime = ref(0); // en segundos
const startTime = ref(null);

// Archivos locales (subida / drag & drop / dibujo)
const files = ref([]); // { name, type, size, dataUrl }
const canvasRef = ref(null);
const drawing = ref(false);
let ctx = null;

// Modo de entrada: 'url' (scrapear) o 'file' (subida local)
const mode = ref('url');

// Validación simple: si modo 'url' requiere URL, si 'file' requiere al menos un archivo
const isValid = computed(() => {
  return mode.value === 'url'
    ? form.value.url.trim().length > 0
    : files.value.length > 0;
});

// Progreso aproximado basado en jobStatus
const progressPercent = computed(() => {
  if (status.value.jobStatus === 'queued') return 10;
  if (status.value.jobStatus === 'started') return 50;
  if (status.value.jobStatus === 'finished') return 100;
  if (status.value.jobStatus === 'failed') return 100;
  return 0;
});

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const handleFiles = async (fileList) => {
  for (const f of Array.from(fileList)) {
    try {
      const dataUrl = await readFileAsDataUrl(f);
      files.value.push({ name: f.name, type: f.type, size: f.size, dataUrl });
    } catch (e) {
      console.error('Error leyendo archivo', f.name, e);
    }
  }
};

const onFileInputChange = (e) => {
  handleFiles(e.target.files);
  e.target.value = null;
};

const onDragOver = (e) => {
  e.preventDefault();
};

const onDrop = (e) => {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files) {
    handleFiles(e.dataTransfer.files);
  }
};

const removeFile = (idx) => {
  files.value.splice(idx, 1);
};

const startAutoPolling = () => {
  startTime.value = Date.now();
  elapsedTime.value = 0;

  // Actualizar contador cada segundo
  timerIntervalId.value = setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
    }
  }, 1000);

  // Polling cada 5 segundos
  pollIntervalId.value = setInterval(() => {
    checkStatus();
  }, 5000);

  // Verificación inicial inmediata
  checkStatus();
};

const stopAutoPolling = () => {
  if (pollIntervalId.value) {
    clearInterval(pollIntervalId.value);
    pollIntervalId.value = null;
  }
  if (timerIntervalId.value) {
    clearInterval(timerIntervalId.value);
    timerIntervalId.value = null;
  }
};

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
      tags: tagsArray,
      source: mode.value === 'file' ? 'file' : 'url'
    };

    // Si el origen es 'file', eliminamos la URL y adjuntamos archivos.
    if (mode.value === 'file') {
      delete payload.url;
      if (files.value.length > 0) {
        payload.files = files.value.map(f => ({ filename: f.name, content_type: f.type, data: f.dataUrl }));
      }
    }

    const response = await api.submitJob(payload);
    status.value.jobId = response.job_id;
    status.value.jobStatus = response.status;
    
    // Limpiar formulario tras envío exitoso
    form.value.url = ''; 
    form.value.description = '';
    form.value.tags = '';
    files.value = [];

    // Iniciar auto-polling
    startAutoPolling();
  } catch (err) {
    status.value.error = err.message;
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
      stopAutoPolling();
    } else if (res.status === 'failed') {
      status.value.error = `El job falló: ${res.exc_info || 'Error desconocido'}`;
      stopAutoPolling();
    }
  } catch (err) {
    status.value.error = "Error consultando estado: " + err.message;
  }
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const resetJobPanel = () => {
  status.value.jobId = null;
  status.value.jobStatus = null;
  status.value.jobResult = null;
  status.value.error = null;
  elapsedTime.value = 0;
  startTime.value = null;
  stopAutoPolling();
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
  }
});

onUnmounted(() => {
  stopAutoPolling();
});
</script>

<template>
  <div class="card">
    <h2>📥 Agregar Media</h2>
    
    <form @submit.prevent="handleSubmit" class="form-grid">
      <div class="field">
        <label>Modo</label>
        <div>
          <label style="margin-right:1rem"><input type="radio" v-model="mode" value="url" /> Usar URL (scrapear)</label>
          <label><input type="radio" v-model="mode" value="file" /> Subir archivo (evita scraping)</label>
        </div>
      </div>

      <div class="field" v-if="mode === 'url'">
        <label>Tweet URL *</label>
        <input 
          v-model="form.url" 
          type="url" 
          placeholder="https://x.com/usuario/status/..." 
          :required="mode === 'url'"
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

      <div class="field" v-if="mode === 'file'">
        <label>Subir archivos o dibujar</label>

        <div class="upload-area" @dragover.prevent="onDragOver" @drop.prevent="onDrop">
          <input type="file" multiple @change="onFileInputChange" />
          <p>Arrastra archivos aquí o selecciona desde el explorador.</p>
        </div>

        <ul class="file-list">
          <li v-for="(f, idx) in files" :key="idx" class="file-item">
            <img v-if="f.type && f.type.startsWith('image')" :src="f.dataUrl" alt="thumb" class="thumb" />
            <span class="file-name">{{ f.name }}</span>
            <button type="button" class="btn-link" @click="removeFile(idx)">Eliminar</button>
          </li>
        </ul>
      </div>

      <button :disabled="status.loading || !isValid" class="btn-primary">
        {{ status.loading ? 'Enviando...' : 'Guardar' }}
      </button>
      
      <p v-if="status.error && !status.jobId" class="error-msg">{{ status.error }}</p>
    </form>

    <div v-if="status.jobId" class="job-status-panel">
      <div class="job-header">
        <div class="job-info">
          <div class="job-title">Procesando...</div>
          <div class="job-meta">
            <span class="job-id">Job: <code>{{ status.jobId }}</code></span>
            <span class="job-time">⏱️ {{ formatTime(elapsedTime) }}</span>
          </div>
        </div>
        <span :class="['status-badge', status.jobStatus]">{{ status.jobStatus }}</span>
      </div>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-label">{{ progressPercent }}%</div>
      </div>

      <div v-if="status.jobStatus === 'started'" class="status-message info">
        <span class="spinner"></span> Procesando archivo...
      </div>

      <div v-if="status.jobResult" class="status-message success">
        ✅ Completado. Items guardados: <strong>{{ status.jobResult.items ? status.jobResult.items.length : 0 }}</strong>
      </div>

      <div v-if="status.error && status.jobId" class="status-message error">
        ❌ {{ status.error }}
      </div>

      <button @click="resetJobPanel" class="btn-secondary btn-sm">
        ✕ Cerrar
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos del componente */
.form-grid { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.25rem; }

/* Job Status Panel */
.job-status-panel { 
  margin-top: 1.5rem; 
  padding: 1.5rem; 
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px; 
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.job-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.job-info { flex: 1; }

.job-title { 
  font-size: 1.1rem; 
  font-weight: 600; 
  color: #212529;
  margin-bottom: 0.5rem;
}

.job-meta { 
  display: flex; 
  gap: 1rem; 
  font-size: 0.9rem;
  color: #6c757d;
}

.job-id code { 
  background: #fff; 
  padding: 0.2rem 0.4rem; 
  border-radius: 3px; 
  font-family: monospace;
  font-size: 0.85em;
}

.job-time { 
  display: flex; 
  align-items: center; 
  gap: 0.3rem;
}

.status-badge { 
  padding: 0.35rem 0.75rem; 
  border-radius: 20px; 
  font-size: 0.8rem; 
  font-weight: 600; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-badge.queued { background: #fff3cd; color: #664d03; }
.status-badge.started { background: #cff4fc; color: #055160; }
.status-badge.finished { background: #d1e7dd; color: #0f5132; }
.status-badge.failed { background: #f8d7da; color: #842029; }

/* Progress Bar */
.progress-container { 
  margin-bottom: 1rem;
}

.progress-bar { 
  width: 100%; 
  height: 8px; 
  background: #e9ecef; 
  border-radius: 4px; 
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-fill { 
  height: 100%; 
  background: linear-gradient(90deg, #0d6efd, #0dcaf0);
  border-radius: 4px;
  transition: width 0.4s ease;
  box-shadow: 0 0 8px rgba(13, 110, 253, 0.5);
}

.progress-label { 
  text-align: right; 
  font-size: 0.85rem; 
  font-weight: 600; 
  color: #495057;
  margin-top: 0.25rem;
}

/* Status Messages */
.status-message { 
  padding: 0.75rem 1rem; 
  margin-bottom: 1rem; 
  border-radius: 6px; 
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
  font-size: 0.95rem;
}

.status-message.info { 
  background: #cff4fc; 
  color: #055160; 
  border: 1px solid #b6effb;
}

.status-message.success { 
  background: #d1e7dd; 
  color: #0f5132; 
  border: 1px solid #badbcc;
}

.status-message.error { 
  background: #f8d7da; 
  color: #842029; 
  border: 1px solid #f5c2c7;
}

/* Spinner Animation */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Otros estilos */
.upload-area { border: 2px dashed #ced4da; padding: 1rem; border-radius: 6px; text-align: center; background: #fff; }
.file-list { list-style: none; padding: 0; margin: 0.5rem 0 0 0; display: flex; flex-direction: column; gap: 0.5rem; }
.file-item { display: flex; align-items: center; gap: 0.5rem; }
.thumb { width: 72px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #e9ecef; }
.file-name { flex: 1; }
.btn-link { background: none; border: none; color: #d63384; cursor: pointer; }
.btn-secondary { padding: 0.4rem 0.6rem; border-radius: 4px; border: 1px solid #ced4da; background: #f8f9fa; cursor: pointer; }
.btn-sm { font-size: 0.85rem; }
</style>