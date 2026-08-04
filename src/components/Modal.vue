<script setup>
import { ref, onMounted, onUnmounted, nextTick, useId } from 'vue';

defineProps({ titulo: { type: String, required: true } });
const emit = defineEmits(['fechar']);

const caixa = ref(null);
const id = useId();
let focoAnterior = null;

const focaveis = () =>
  [...(caixa.value?.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ) || [])].filter(el => el.offsetParent !== null);

// Sem isto o Tab saía do modal e passeava pela página atrás do overlay.
const aoTeclar = (e) => {
  if (e.key === 'Escape') { emit('fechar'); return; }
  if (e.key !== 'Tab') return;
  const alvos = focaveis();
  if (alvos.length === 0) return;
  const [primeiro, ultimo] = [alvos[0], alvos[alvos.length - 1]];
  if (e.shiftKey && document.activeElement === primeiro) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primeiro.focus();
  }
};

onMounted(async () => {
  focoAnterior = document.activeElement;
  document.addEventListener('keydown', aoTeclar);
  document.body.style.overflow = 'hidden';
  await nextTick();
  focaveis()[0]?.focus();
});

onUnmounted(() => {
  document.removeEventListener('keydown', aoTeclar);
  document.body.style.overflow = '';
  // devolve o foco ao botão que abriu o modal
  focoAnterior?.focus?.();
});
</script>

<template>
  <div class="overlay" @mousedown.self="emit('fechar')">
    <div ref="caixa" class="modal" role="dialog" aria-modal="true" :aria-labelledby="`${id}-titulo`">
      <header class="modal-cabecalho">
        <h2 :id="`${id}-titulo`"><slot name="titulo">{{ titulo }}</slot></h2>
        <button type="button" class="modal-fechar" aria-label="Fechar" @click="emit('fechar')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <slot />
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: overlay-entra 0.15s ease;
}

.modal {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  border-radius: var(--raio);
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-entra 0.2s ease;
}

.modal-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--borda);
}
.modal-cabecalho h2 { font-size: 1.25rem; font-weight: 700; color: var(--texto-forte); }

.modal-fechar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin: -0.6rem -0.7rem -0.6rem 0;
  background: transparent;
  border: none;
  border-radius: var(--raio-sm);
  color: var(--texto-suave);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.modal-fechar:hover { background: color-mix(in srgb, var(--texto-forte) 6%, transparent); color: var(--texto-forte); }

@keyframes overlay-entra { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-entra {
  from { opacity: 0; transform: translateY(8px) scale(0.99); }
  to   { opacity: 1; transform: none; }
}

@media (max-width: 600px) {
  .overlay { padding: 0; align-items: flex-end; }
  .modal { max-width: none; max-height: 94dvh; border-radius: var(--raio) var(--raio) 0 0; }
}
</style>
