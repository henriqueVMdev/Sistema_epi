<script setup>
import { ref, computed, onMounted, onUnmounted, useId } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  opcoes: { type: Array, default: () => [] },
  rotulo: { type: String, required: true },
  placeholder: { type: String, default: 'Selecione uma ou mais opções' },
  vazio: { type: String, default: 'Nenhuma opção cadastrada.' },
});
const emit = defineEmits(['update:modelValue']);

const aberto = ref(false);
const raiz = ref(null);
const id = useId();

const selecionados = computed(() => props.modelValue || []);

const alternar = (nome) => {
  const atual = selecionados.value;
  emit('update:modelValue', atual.includes(nome)
    ? atual.filter(s => s !== nome)
    : [...atual, nome]);
};

// Clicar fora e Escape fecham. Antes o menu só fechava clicando no gatilho de
// novo, então dava para deixar dois menus abertos por cima do formulário.
const aoClicarFora = (e) => {
  if (aberto.value && raiz.value && !raiz.value.contains(e.target)) aberto.value = false;
};
const aoTeclar = (e) => {
  if (e.key === 'Escape' && aberto.value) {
    aberto.value = false;
    raiz.value?.querySelector('.ms-gatilho')?.focus();
  }
};
onMounted(() => {
  document.addEventListener('mousedown', aoClicarFora);
  document.addEventListener('keydown', aoTeclar);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', aoClicarFora);
  document.removeEventListener('keydown', aoTeclar);
});
</script>

<template>
  <div class="campo">
    <span :id="`${id}-rotulo`" class="ms-rotulo">{{ rotulo }}</span>
    <div ref="raiz" class="multi-select" :class="{ aberto }">
      <button
        type="button"
        class="ms-gatilho"
        :aria-expanded="aberto"
        :aria-controls="`${id}-menu`"
        :aria-labelledby="`${id}-rotulo ${id}-resumo`"
        @click="aberto = !aberto"
      >
        <span :id="`${id}-resumo`" class="ms-resumo">
          <span v-if="selecionados.length === 0" class="ms-placeholder">{{ placeholder }}</span>
          <span v-else class="ms-tags">
            <span v-for="s in selecionados" :key="s" class="ms-tag">
              {{ s }}
              <span
                class="ms-tag-x"
                role="button"
                tabindex="0"
                :aria-label="`Remover ${s}`"
                @click.stop="alternar(s)"
                @keydown.enter.prevent.stop="alternar(s)"
                @keydown.space.prevent.stop="alternar(s)"
              >×</span>
            </span>
          </span>
        </span>
        <span class="ms-seta" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div v-if="aberto" :id="`${id}-menu`" class="ms-menu">
        <label v-for="nome in opcoes" :key="nome" class="ms-opcao">
          <input
            type="checkbox"
            :checked="selecionados.includes(nome)"
            @change="alternar(nome)"
          />
          <span>{{ nome }}</span>
        </label>
        <p v-if="opcoes.length === 0" class="ms-vazio">{{ vazio }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.ms-rotulo { color: var(--texto); font-size: 0.82rem; font-weight: 500; }

.multi-select { position: relative; width: 100%; }

.ms-gatilho {
  width: 100%;
  min-height: 2.85rem;
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: var(--raio-sm);
  padding: 0.4rem 2.2rem 0.4rem 0.7rem;
  color: var(--texto-forte);
  font-size: 0.88rem;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  transition: border-color 0.15s;
}
.multi-select.aberto .ms-gatilho,
.ms-gatilho:hover { border-color: var(--marca); }

.ms-resumo { flex: 1; min-width: 0; }
.ms-placeholder { color: var(--texto-fraco); }
.ms-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.ms-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: color-mix(in srgb, var(--marca) 15%, transparent);
  color: var(--marca);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.2rem 0.3rem 0.2rem 0.5rem;
  border-radius: 0.4rem;
}
.ms-tag-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.3rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}
.ms-tag-x:hover { background: color-mix(in srgb, var(--marca) 25%, transparent); }

.ms-seta {
  position: absolute;
  right: 0.8rem;
  display: flex;
  color: var(--texto-suave);
  transition: transform 0.2s;
}
.multi-select.aberto .ms-seta { transform: rotate(180deg); }

.ms-menu {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  background: var(--superficie-alta);
  border: 1px solid var(--borda);
  border-radius: var(--raio-sm);
  padding: 0.4rem;
  max-height: 220px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.4);
}

.ms-opcao {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.6rem;
  border-radius: 0.35rem;
  cursor: pointer;
  color: var(--texto);
  font-size: 0.86rem;
  transition: background 0.15s;
}
.ms-opcao:hover { background: color-mix(in srgb, var(--marca) 8%, transparent); }

.ms-opcao input[type="checkbox"] {
  appearance: none;
  width: 1.15rem;
  height: 1.15rem;
  border: 1.5px solid var(--texto-fraco);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
  position: relative;
  transition: background 0.15s, border-color 0.15s;
}
.ms-opcao input[type="checkbox"]:hover { border-color: var(--marca); }
.ms-opcao input[type="checkbox"]:checked {
  background: var(--marca);
  border-color: var(--marca);
}
/* O “visto” faltava: marcado e desmarcado só mudavam de cor de fundo. */
.ms-opcao input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 0.36rem;
  top: 0.14rem;
  width: 0.28rem;
  height: 0.55rem;
  border: solid var(--marca-texto);
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.ms-vazio { padding: 0.6rem; color: var(--texto-suave); font-size: 0.82rem; text-align: center; }
</style>
