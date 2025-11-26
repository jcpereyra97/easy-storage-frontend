<script setup>
import SubmitForm from '../components/SubmitForm.vue';
import SearchMedia from '../components/SearchMedia.vue';
</script>

<template>
  <div class="dashboard">
    <section>
      <SubmitForm />
    </section>
    <section>
      <SearchMedia />
    </section>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 2rem; }
</style>