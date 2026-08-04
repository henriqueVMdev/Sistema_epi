<script setup>
// Substitui o Font Awesome via CDN (~75 KB bloqueando o render) pelos 11 glifos
// que o app realmente usa. Traço de 2px, grade de 24 — mesma família dos SVGs
// que já estavam inline na home e no dashboard.
defineProps({
  nome: { type: String, required: true },
  tamanho: { type: [Number, String], default: 20 },
  // Sem rótulo o ícone é decorativo e some para o leitor de tela.
  rotulo: { type: String, default: null },
});

const CAMINHOS = {
  estoque: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  adicionar: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  retirada: '<path d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2"/><line x1="12" y1="3" x2="12" y2="14"/><polyline points="8 10 12 14 16 10"/>',
  capacete: '<line x1="2" y1="18" x2="22" y2="18"/><path d="M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M9 7.3V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3.3"/>',
  aprovacoes: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><polyline points="9 14 11 16 15 12"/>',
  grafico: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  usuarios: '<path d="M12 22s7-3.5 7-9V5l-7-3-7 3v8c0 5.5 7 9 7 9z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.6 16.2a3.9 3.9 0 0 1 6.8 0"/>',
  cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  aspas: '<path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4"/><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4"/>',
  alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
};
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="rotulo ? 'img' : null"
    :aria-label="rotulo"
    :aria-hidden="rotulo ? null : 'true'"
    class="icone"
    v-html="CAMINHOS[nome]"
  />
</template>

<style scoped>
.icone { display: block; flex-shrink: 0; }
</style>
