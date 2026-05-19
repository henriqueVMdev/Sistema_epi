<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter }  from 'vue-router'
import { useSupabase } from '../composables/useSupabase' 

const router = useRouter();
const { supabase } = useSupabase();
const setores = ref([]);
const form = reactive({ nome: '', email: '', cpf: '', setor_id: null });
const error = ref('');
const senha = ref('');

const carregarSetores = async () => {
  const { data } = await supabase.from('setores').select('id, nome').order('nome');
  setores.value = data || [];
};

onMounted(carregarSetores);

const cadastrar = async () => {
  error.value = '';
  if (!form.nome || !form.email || !form.cpf || !senha.value) {
    error.value = 'Preencha todos os campos.'; return;
  }
  if (!form.setor_id) { error.value = 'Selecione um setor.'; return; }

  // 1) Pré-checagem: CPF ou e-mail já existem em funcionarios?
  const { data: existentes, error: checkError } = await supabase
    .from('funcionarios')
    .select('cpf, email')
    .or(`cpf.eq.${form.cpf},email.eq.${form.email}`);
  if (checkError) {
    console.error(checkError);
    error.value = 'Erro ao validar os dados. Tente novamente.';
    return;
  }
  if (existentes && existentes.length > 0) {
    const cpfExiste = existentes.some(e => e.cpf === form.cpf);
    const emailExiste = existentes.some(e => e.email === form.email);
    if (cpfExiste && emailExiste) error.value = 'CPF e e-mail já cadastrados.';
    else if (cpfExiste) error.value = 'Este CPF já está cadastrado.';
    else error.value = 'Este e-mail já está cadastrado.';
    return;
  }

  // 2) Cria o usuário no auth
  const { data, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: senha.value,
  });
  if (authError) { error.value = authError.message; return; }

  // 3) Insere em funcionarios. Se falhar, desloga pra não deixar sessão de usuário órfão.
  const { error: insertError } = await supabase
    .from('funcionarios')
    .insert({
      nome: form.nome,
      email: form.email,
      cpf: form.cpf,
      setor_id: form.setor_id,
      user_id: data.user.id,
    });
  if (insertError) {
    console.error('erro ao cadastrar:', insertError);
    await supabase.auth.signOut();
    error.value = insertError.code === '23505'
      ? 'CPF ou e-mail já estão em uso.'
      : 'Erro ao cadastrar funcionário. Avise o administrador.';
    return;
  }
  router.push('/login');
}
</script>


<template>
<div class="container">
  <div class="caixa">
    <form @submit.prevent="cadastrar">
      <H1>
        <span class="white"> Omni </span> 
        <span class="amarelo"> Seg </span>
      </H1>

      <p class = "mensagem"> Registre-se e desfrute do controle e facilidade</p>
      
      <div class = "campo">
        <label>Email:</label>
        <input v-model = "form.email" type="email" placeholder="seuemail@exemplo.com">
      </div>

      <div class = "campo">
        <label>Senha:</label>
        <input v-model = "senha" type="password" placeholder="Digite sua senha">
      </div>

      <div class = "campo">
        <label>nome:</label>
        <input v-model = "form.nome" type="text" placeholder="Ex: João Silva">
      </div>

      <div class = "campo">
        <label>CPF:</label>
        <input v-model = "form.cpf" type="text" placeholder="Ex: 123.456.789-00">
      </div>

      <div class = "campo">
        <label>Setor:</label>
        <select v-model="form.setor_id">
          <option :value="null" disabled>Selecione o setor</option>
          <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
        </select>
      </div>

      <p class = "error" v-if = "error"> {{ error }} </p>

    <button class = "btn">
      Criar Conta
    </button>

  </form>
  </div>
</div>
</template>

<style scoped>
.container{
  background-image: url(../assets/background.png);
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
}

.caixa {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
}
form {
  width: 90%;
  max-width: 25rem;
  min-height: 40rem;
  background-color: #131314 !important;
  background-position: center;
  display:flex;  
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  border-radius: 20px;
  border: 2px solid #f49e2554;
  
  padding: 32px;
}

button.btn {
  display: flex;
  justify-content: center;
  background-color: #F49D25;
  color: white;
  border: none;
  padding: 0.7rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 1.5rem;
  font-size: 1.1rem;
}

label {
  color: #ffffff;
  font-size: 0.9rem;
  padding-bottom: 3px;
  padding-top: 1.5rem;
  font-size: 1rem;
}

input, select {
  justify-content: center;
  color: #9CA3AF ;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px;
  gap: 2px;
  border: none;
  border: 1px solid #262729;
  outline: none;
  border-radius: 10px;
}

.campo {
  display: flex;
  flex-direction: column;
}

.error {
  color: #dd5e5e;
  font-size: 0.9rem;
}

h1 { 
  display: flex;
  justify-content: center;
  font-size: 2.5rem;
}

.amarelo {
  color: #F49D25;
}

.white {
  color: #ffffff;
}

.mensagem {
  text-align: center;
  color: #9CA3AF;
  font-size: 1rem;
  padding-bottom: 0.5rem;
   ;
}

.divisor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  padding-top: 1.5rem;
  font-size: 1.2rem;
}

.divisor::before,
.divisor::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: #9CA3AF;
}

.link {
  display: block;
  text-align: center;
  text-decoration: none;
  color:#F49D25;
  margin-top: 1.5rem;
  font-size: 1.2rem;
}
</style>