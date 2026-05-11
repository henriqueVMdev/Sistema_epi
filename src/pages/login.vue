<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useSupabase } from '../composables/useSupabase';
const email = ref('');
const senha = ref('');
const { supabase } = useSupabase();
const error = ref('');
const router = useRouter();

async function login() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: senha.value
  })

 if (authError) {
  error.value = authError.message;
 } else {
   router.push('/cadastro_epi');
 }
}
</script>

<template>
<div class="container">
  <div class="caixa">
    <form @submit.prevent="login">
      <H1>
        <span class="white"> Omni </span> 
        <span class="amarelo"> Seg </span>
      </H1>

      <p class = "mensagem"> entre para gerenciar seu estoque de segurança</p>
      
      <div class = "campo">
        <label>Email:</label>
        <input v-model = "email">
      </div>

      <div class = "campo">
        <label>Senha:</label>
        <input v-model = "senha" type="password">
      </div>

      <p class = "error" v-if = "error"> {{ error }} </p>

    

    <button class = "btn">
      Entrar na Plataforma
    </button>

    <p class = "divisor"> Novo na empresa?</p>

    <RouterLink class = "link" to = "/cadastro_user">
      <p class="link_Cadastro">Criar uma conta</p>
    </RouterLink>

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
  max-height: 35rem;
  min-height: 35rem;
  min-width: 25rem;
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