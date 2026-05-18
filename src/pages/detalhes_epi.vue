<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupabase } from '../composables/useSupabase';

const { supabase } = useSupabase();
const route = useRoute();
const router = useRouter();

const epi = ref(null);
const carregando = ref(true);
const erro = ref(null);

const formatarData = (data) => {
  if (!data) return '—';
  const [ano, mes, dia] = String(data).split('T')[0].split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
};

const carregar = async () => {
  carregando.value = true;
  const { data, error } = await supabase
    .from('epis')
    .select('*')
    .eq('id', route.params.id)
    .single();

  if (error) {
    erro.value = error.message;
    console.error(error);
  } else {
    epi.value = data;
  }
  carregando.value = false;
};

const voltar = () => router.push('/estoque');

onMounted(carregar);
</script>

<template>
  <div class="pagina-detalhes">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Home <span class="separador">›</span>
          <span @click="voltar" class="caminho-clicavel">Estoque</span>
          <span class="separador">›</span>
          <span class="caminho-atual">Detalhes do EPI</span>
        </p>
        <h1 class="titulo-pagina">
          Detalhes do <span class="titulo-destaque">EPI</span>
        </h1>
      </div>

      <button type="button" class="botao-voltar" @click="voltar">
        ← Voltar para Estoque
      </button>
    </header>

    <p v-if="carregando" class="estado">Carregando...</p>
    <p v-else-if="erro" class="estado erro">Erro: {{ erro }}</p>
    <p v-else-if="!epi" class="estado">EPI não encontrado.</p>

    <section v-else class="detalhes">
      <div class="bloco-imagem">
        <img v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
        <div v-else class="imagem-placeholder">Sem imagem</div>
      </div>

      <div class="bloco-info">
        <h2 class="epi-nome">{{ epi.nome }}</h2>
        <p class="epi-fabricante">Fabricante: <span>{{ epi.fabricante || '—' }}</span></p>

        <div class="estoque-destaque" :class="{ alerta: Number(epi.estoque) <= Number(epi.estoque_minimo) && Number(epi.estoque_minimo) > 0 }">
          <span class="estoque-label">Em estoque</span>
          <span class="estoque-numero">{{ epi.estoque || 0 }}</span>
          <span class="estoque-minimo">mín. {{ epi.estoque_minimo || 0 }} un.</span>
        </div>

        <div class="grade-info">
          <div class="campo">
            <span class="label">Número do CA</span>
            <span class="valor">#{{ epi.numero_ca || '—' }}</span>
          </div>
          <div class="campo">
            <span class="label">Data de validade</span>
            <span class="valor">{{ formatarData(epi.data_validade) }}</span>
          </div>
          <div class="campo">
            <span class="label">Custo</span>
            <span class="valor">R$ {{ epi.custo || '—' }}</span>
          </div>
          <div class="campo">
            <span class="label">Setor de uso</span>
            <span class="valor">{{ epi.setor || '—' }}</span>
          </div>
        </div>

        <div class="campo descricao">
          <span class="label">Descrição</span>
          <p class="valor-texto">{{ epi.descricao || 'Sem descrição cadastrada.' }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina-detalhes {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem 3rem;
  box-sizing: border-box;
  width: 100%;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.caminho { color: #8b8680; font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: #fff; }
.caminho-clicavel { cursor: pointer; transition: color 0.2s; }
.caminho-clicavel:hover { color: #F49D25; }

.titulo-pagina {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.titulo-destaque { color: #F49D25; }

.botao-voltar {
  background: #2a241e;
  color: #fff;
  border: 1px solid #3a332b;
  padding: 0.7rem 1.2rem;
  border-radius: 0.55rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}
.botao-voltar:hover { background: #342c25; }

.estado { color: #8b8680; }
.estado.erro { color: #f87171; }

.detalhes {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1rem;
  padding: 2rem;
}

.bloco-imagem {
  background: #2a2520;
  border-radius: 0.85rem;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bloco-imagem img { width: 100%; height: 100%; object-fit: cover; }
.imagem-placeholder { color: #6b6359; font-size: 0.9rem; }

.bloco-info { display: flex; flex-direction: column; gap: 1.4rem; }

.epi-nome {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
}
.epi-fabricante { color: #8b8680; font-size: 0.95rem; margin-top: -0.8rem; }
.epi-fabricante span { color: #c5bfb5; font-weight: 600; }

.estoque-destaque {
  display: inline-flex;
  flex-direction: column;
  background: rgba(244, 157, 37, 0.08);
  border: 1px solid rgba(244, 157, 37, 0.25);
  border-radius: 0.75rem;
  padding: 1rem 1.4rem;
  align-self: flex-start;
  min-width: 180px;
}
.estoque-destaque.alerta {
  background: rgba(220, 60, 60, 0.1);
  border-color: rgba(220, 60, 60, 0.4);
}
.estoque-label {
  color: #F49D25;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.estoque-destaque.alerta .estoque-label { color: #f87171; }
.estoque-numero {
  color: #fff;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin: 0.3rem 0 0.2rem;
}
.estoque-destaque.alerta .estoque-numero { color: #f87171; }
.estoque-minimo { color: #8b8680; font-size: 0.8rem; }

.grade-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1.5rem;
}

.campo { display: flex; flex-direction: column; gap: 0.25rem; }
.label {
  color: #F49D25;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.valor { color: #fff; font-size: 1rem; font-weight: 500; }
.valor-texto {
  color: #c5bfb5;
  font-size: 0.95rem;
  line-height: 1.65;
  background: #2a2520;
  padding: 0.9rem 1.1rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(255,255,255,0.04);
}

@media (max-width: 900px) {
  .detalhes { grid-template-columns: 1fr; }
  .grade-info { grid-template-columns: 1fr; }
}
</style>
