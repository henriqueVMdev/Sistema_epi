<!--        




<template>
  <div class="layout-container">
    
    <header class="header-section">
      <h1>Cadastro de EPIs</h1>
      <p>Gerencie o catálogo de Equipamentos de Proteção Individual e C.A.</p>
    </header>

    <main class="content">
      <section class="card-form">
        <div class="card-header">
          <h3>{{ editandoId ? 'Editar Equipamento' : 'Novo Equipamento' }}</h3>
        </div>
        
        <form @submit.prevent="salvar" class="main-form">
          <div class="form-row">

            <div class="form-group">
              <label>Nome do EPI</label>
              <input v-model="form.nome" type="text" placeholder="Ex: Capacete de Segurança" required>
            </div>
            <div class="form-group">
              <label>Número do C.A.</label>
              <input v-model="form.numero_ca" type="text" placeholder="Ex: 12345" required>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label>Descrição / Especificações</label>
            <input v-model="form.descricao" type="text" placeholder="Ex: Classe B, com jugular">
          </div>
               
          <div class="form-group" style="margin-bottom: 20px;">
            <label>Data de Validade</label>
            <input v-model="form.data_validade" type="date" placeholder="Ex: 12/31/2023">
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label>Setor de uso</label>
            <input v-model="form.setor" type="text" placeholder="Ex: Setor de Manutenção">
          </div>
          
          <div class="action-bar">
            <button type="submit" class="btn btn-primary">
              {{ editandoId ? 'Salvar Alterações' : 'Cadastrar EPI' }}
            </button>
            <button v-if="editandoId" type="button" @click="cancelarEdicao" class="btn btn-outline">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <section class="card-table">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Equipamento</th>
              <th>C.A.</th>
              <th>Descrição</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in epis" :key="e.id">
              <td><span class="text-bold">{{ e.nome }}</span></td>
              <td><span class="badge-ca">{{ e.numero_ca }}</span></td>
              <td>{{ e.descricao }}</td>
              <td class="text-center">
                <button @click="prepararEdicao(e)" class="btn-action edit">Editar</button>
                <button @click="excluir(e.id)" class="btn-action delete">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase } = useSupabase();
const epis = ref([]);
const editandoId = ref(null);
const form = reactive({ nome: '', numero_ca: '', descricao: '', data_validade: '' });

// Busca os EPIs no banco
const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

// Salva ou Atualiza
const salvar = async () => {
  if (editandoId.value) {
    await supabase.from('epis').update(form).eq('id', editandoId.value);
  } else {
    const { error } = await supabase.from('epis').insert(form);
    if (error) {
      console.error('erro ao cadastrar:', error);
    }
  }
  cancelarEdicao();
  carregar();
};

const prepararEdicao = (e) => {
  editandoId.value = e.id;
  Object.assign(form, { nome: e.nome, numero_ca: e.numero_ca, descricao: e.descricao, data_validade: e.data_validade });
};

const excluir = async (id) => {
  if (confirm('Deseja excluir este equipamento?')) {
    await supabase.from('epis').delete().eq('id', id);
    carregar();
  }
};

const cancelarEdicao = () => {
  editandoId.value = null;
  Object.assign(form, { nome: '', numero_ca: '', descricao: '', data_validade: '' });
};

onMounted(carregar);
</script>

 -->

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useRouter } from 'vue-router';

const { supabase } = useSupabase();
const epis = ref([]);
const editandoId = ref(null);
const form = reactive({ nome: '', numero_ca: '', descricao: '', data_validade: '', fabricante: '', setor: '', quantidade: '', estoque_atual: 0 });
const router = useRouter();

const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

const salvar = async () => {
  if (editandoId.value) {
    await supabase.from('epis').update(form).eq('id', editandoId.value);
  } else {
    const { error } = await supabase.from('epis').insert(form);
    if (error) {
      console.error('erro ao cadastrar:', error);
    }
  }
  cancelarEdicao();
  carregar();
};

const prepararEdicao = (e) => {
  editandoId.value = e.id;
  Object.assign(form, { nome: e.nome, numero_ca: e.numero_ca, descricao: e.descricao, data_validade: e.data_validade, fabricante: e.fabricante, setor: e.setor, quantidade: e.quantidade, estoque_atual: e.estoque_atual });
};

const excluir = async (id) => {
  if (confirm('Deseja excluir este equipamento?')) {
    await supabase.from('epis').delete().eq('id', id);
    carregar();
  }
};

const cancelarEdicao = () => {
  editandoId.value = null;
  Object.assign(form, { nome: '', numero_ca: '', descricao: '', data_validade: '', fabricante: '', setor: '', quantidade: '', estoque_atual: 0 });
};

onMounted(carregar);
</script>

<template>
  <section class = "pagina">
    <header class="title">
      <p class = "path"> Home > estoque > <span class = "white"> Cadastro de EPI</span> </p>
      <h1>Novo<span class ="yellow-title">EPI</span></h1>
      <p>Preencha os dados abaixo para registrar um novo equipamento de proteção.</p>
      <button class = "cancelar">Cancelar</button>
      <button class = "cadastrar">Salvar cadastro</button>
    </header>

  </section>

    <section class = "informações">
      <h1>Informações Básicas</h1> 

      <div class = "campo">
        <label for="nome">Nome do EPI</label>
        <input v-model = form.nome type= "text" placeholder="Ex: Capacete de Segurança">
      </div>

      <div class = "campo">
        <label for="Setor">Setor de uso</label>
        <input v-model = form.setor type="text" placeholder="Ex: Setor de Manutenção">
      </div>

      <div class = "campo">
        <label for="fabricante">Fabricante</label>
        <input v-model = form.fabricante type="text" placeholder="Ex: Segurança Ltda">
      </div>

      <div class = "campo">
        <label for="Custo">Custo</label>
        <input v-model = form.setor type="Double" placeholder="Ex: 19,90">
      </div>

  </section>

  <section class = "ca">
      <h1>Certificação de Aprovação (C.A.)</h1>
      <label for ="numero_ca">Número do C.A.</label>
      <input v-model = form.numero_ca type="text" placeholder="Ex: 12345">

      <label  for="data_validade">Data de Validade</label>
      <input v-model = form.data_validade type="date" placeholder="Ex: 12/31/2027">
  </section>

  <section class = "controle_estoque">
      <h1>Controle de Estoque</h1>

      <label for="quantidade">Quantidade em Estoque</label>
      <input v-model = form.quantidade type="number" placeholder="Ex: 0">

      <label for="estoque_atual">Estoque Atual</label>
      <input v-model = form.estoque_atual type="number" default = 0>
  </section>
</template>

<style scoped>

.pagina {
  background: #181511;
  min-height: 100vh;
}

.title h1{
    justify-content: flex-start;
    text-align: left;
    gap: 8px;
    margin-bottom: 24px;
    color: #fff;
  }

  h1 .yellow-title {
    color: #F49D25;
  }

  .informações{
    display: flex;
    flex-direction: row;
    background: #221E18;
    position: center;
    border-radius: 20px;
  }

  input{
    background: #131314;
    border: none;
    border-radius: 8px;
    padding: 0.8rem;
    color: #fff;
    display:flex;
    flex-direction: row;
    margin:0.5rem;
  }

</style>