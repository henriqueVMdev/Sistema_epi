<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter }  from 'vue-router'
import { useSupabase } from '../composables/useSupabase' 

const funcionarios = ref([]);
const editandoId = ref(null);
const router = useRouter();
const { supabase } = useSupabase();
const form = reactive({ nome: '', email: '', cpf: '', setor: ''});
const error = ref('');
const senha = ref('');

const carregar = async () => {
  const { data } = await supabase.from('funcionarios').select('*').order('nome')
  funcionarios.value = data || [];
};

const cadastrar = async () => {
  if (editandoId.value) {
    await supabase.from('funcionarios').update(form).eq('id', editandoId.value);
  } else {
    const { error:insertError } = await supabase.from('funcionarios').insert(form);
    if (insertError) {
      console.error('erro ao cadastrar:', insertError);
      error.value = 'Erro ao cadastrar funcionário.';
    } else {
      router.push('/login');
      }
    }
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
        <input v-model = "form.setor" type="text" placeholder="Ex: RH">
      </div>

      <p class = "error" v-if = "error"> {{ error }} </p>

    <button class = "btn">
      Criar Conta
    </button>

  </form>
  </div>
</div>
</template>

<style>
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

input{
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