<script setup>
defineProps({
  // { tipo: 'sucesso' | 'erro', texto: string } ou null
  mensagem: { type: Object, default: null },
});
</script>

<template>
  <!-- A região existe sempre, vazia. Leitor de tela só anuncia mudanças dentro
       de um live region que já estava no DOM — se o elemento inteiro aparece
       junto com o texto, o anúncio não sai. -->
  <div class="toast-regiao" role="status" aria-live="polite">
    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">
      <span v-if="mensagem.tipo === 'erro'" class="toast-icone" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <span v-else class="toast-icone" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span>{{ mensagem.texto }}</span>
    </div>
  </div>
</template>

<style scoped>
.toast-regiao {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1100;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.3rem;
  border-radius: var(--raio-sm);
  font-size: 0.9rem;
  font-weight: 600;
  max-width: min(420px, calc(100vw - 3rem));
  box-shadow: 0 10px 30px -8px rgb(0 0 0 / 0.5);
  animation: toast-entra 0.22s ease;
}

.toast-icone { display: flex; flex-shrink: 0; }

.toast-sucesso {
  background: color-mix(in srgb, var(--ok) 15%, var(--superficie-elevada));
  border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent);
  color: var(--ok);
}
.toast-erro {
  background: color-mix(in srgb, var(--perigo) 15%, var(--superficie-elevada));
  border: 1px solid color-mix(in srgb, var(--perigo) 40%, transparent);
  color: var(--perigo);
}

@keyframes toast-entra {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: none; }
}

@media (max-width: 600px) {
  .toast-regiao { top: auto; bottom: 1rem; right: 1rem; left: 1rem; }
}
</style>
