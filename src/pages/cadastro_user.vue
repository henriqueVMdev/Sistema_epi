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

const enviando = ref(false);

const cadastrar = async () => {
  if (enviando.value) return;
  error.value = '';
  const nome = form.nome.trim();
  const email = form.email.trim().toLowerCase();
  const cpf = form.cpf.replace(/\D/g, '');

  if (!nome || !email || !cpf || !senha.value) {
    error.value = 'Preencha todos os campos.'; return;
  }
  if (cpf.length !== 11) { error.value = 'CPF deve ter 11 dígitos.'; return; }
  if (senha.value.length < 6) { error.value = 'A senha deve ter ao menos 6 caracteres.'; return; }
  if (!form.setor_id) { error.value = 'Selecione um setor.'; return; }

  enviando.value = true;
  // duas consultas com .eq: .or() com interpolação quebra em valores com vírgula/aspas
  const [{ data: porCpf, error: e1 }, { data: porEmail, error: e2 }] = await Promise.all([
    supabase.from('funcionarios').select('id').eq('cpf', cpf).limit(1),
    supabase.from('funcionarios').select('id').eq('email', email).limit(1),
  ]);
  if (e1 || e2) {
    console.error(e1 || e2);
    enviando.value = false;
    error.value = 'Erro ao validar os dados. Tente novamente.';
    return;
  }
  const cpfExiste = (porCpf || []).length > 0;
  const emailExiste = (porEmail || []).length > 0;
  if (cpfExiste || emailExiste) {
    enviando.value = false;
    if (cpfExiste && emailExiste) error.value = 'CPF e e-mail já cadastrados.';
    else if (cpfExiste) error.value = 'Este CPF já está cadastrado.';
    else error.value = 'Este e-mail já está cadastrado.';
    return;
  }

  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password: senha.value,
  });
  if (authError) {
    enviando.value = false;
    error.value = authError.code === 'user_already_exists'
      ? 'Este e-mail já possui uma conta. Faça login ou use outro e-mail.'
      : authError.message;
    return;
  }
  if (!data?.user?.id) {
    enviando.value = false;
    error.value = 'Não foi possível criar a conta. Tente novamente.';
    return;
  }

  const { error: insertError } = await supabase
    .from('funcionarios')
    .insert({
      nome,
      email,
      cpf,
      setor_id: form.setor_id,
      user_id: data.user.id,
      role: 'aluno',
    });
  enviando.value = false;
  if (insertError) {
    console.error('erro ao cadastrar:', insertError);
    await supabase.auth.signOut();
    if (insertError.code === '23505') error.value = 'CPF ou e-mail já estão em uso.';
    else if (!data.session) error.value = 'Conta criada, mas o cadastro precisa da confirmação do e-mail. Confirme e avise o administrador.';
    else error.value = 'Erro ao cadastrar funcionário. Avise o administrador.';
    return;
  }
  router.push('/login');
}
</script>


<template>
<div class="container">
  <div class="caixa">
    <form @submit.prevent="cadastrar">
      <h1>
        <span class="white"> Omni </span>
        <span class="amarelo"> Seg </span>
      </h1>

      <p class = "mensagem"> Registre-se e desfrute do controle e facilidade</p>
      
      <div class = "campo">
        <label for="cad-email">Email:</label>
        <input id="cad-email" v-model = "form.email" type="email" placeholder="seuemail@exemplo.com">
      </div>

      <div class = "campo">
        <label for="cad-senha">Senha:</label>
        <input id="cad-senha" v-model = "senha" type="password" autocomplete="new-password" placeholder="Digite sua senha">
      </div>

      <div class = "campo">
        <label for="cad-nome">Nome:</label>
        <input id="cad-nome" v-model = "form.nome" type="text" placeholder="Ex: João Silva">
      </div>

      <div class = "campo">
        <label for="cad-cpf">CPF:</label>
        <input id="cad-cpf" v-model="form.cpf" type="text" maxlength="11" inputmode="numeric" placeholder="Ex: 12345678900">
      </div>

      <div class = "campo">
        <label for="cad-setor">Setor:</label>
        <select id="cad-setor" v-model="form.setor_id">
          <option :value="null" disabled>Selecione o setor</option>
          <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
        </select>
      </div>

      <p class="error" role="alert" v-if="error"> {{ error }} </p>

    <button type="submit" class="btn" :disabled="enviando">
      {{ enviando ? 'Criando…' : 'Criar Conta' }}
    </button>

  </form>
  </div>
</div>
</template>

<style scoped>
.container{
  background-image: url(../assets/background.webp);
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
  position: relative;
  padding: 1.5rem 1rem;
}
.caixa::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32rem;
  height: 32rem;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--marca) 70%, transparent) 0%, color-mix(in srgb, var(--marca) 28%, transparent) 40%, transparent 70%);
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
}
form {
  position: relative;
  z-index: 1;
  width: 90%;
  max-width: 25rem;
  min-height: 40rem;
  background-color: var(--superficie) !important;
  background-position: center;
  display:flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  border-radius: 20px;
  border: 2px solid var(--marca-borda);

  padding: 32px;
}

button.btn {
  display: flex;
  justify-content: center;
  background-color: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.7rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 1.5rem;
  font-size: 1.1rem;
}

label {
  color: var(--texto-forte);
  font-size: 0.9rem;
  padding-bottom: 3px;
  padding-top: 1.5rem;
  font-size: 1rem;
}

input, select {
  justify-content: center;
  color: var(--texto-forte);
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px;
  gap: 2px;
  border: none;
  border: 1px solid var(--borda);
  outline: none;
  border-radius: 10px;
}

.campo {
  display: flex;
  flex-direction: column;
}

.error {
  color: var(--perigo);
  font-size: 0.9rem;
}

h1 { 
  display: flex;
  justify-content: center;
  font-size: 2.5rem;
}

.amarelo {
  color: var(--marca);
}

.white {
  color: var(--texto-forte);
}

.mensagem {
  text-align: center;
  color: var(--texto-suave);
  font-size: 1rem;
  padding-bottom: 0.5rem;
   ;
}

.divisor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--texto-suave);
  padding-top: 1.5rem;
  font-size: 1.2rem;
}

.divisor::before,
.divisor::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--texto-suave);
}

.link {
  display: block;
  text-align: center;
  text-decoration: none;
  color:var(--marca);
  margin-top: 1.5rem;
  font-size: 1.2rem;
}
</style>