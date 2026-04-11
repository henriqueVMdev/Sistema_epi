<template>
<div class="container">
  <div class="caixa">
    <form @submit.prevent="login">
      <H1>
        <span class="white"> Omni </span> 
        <span class="amarelo"> Seg </span>
        </H1>
      
      <label>Email:</label>
      <input v-model = "email">

      <label>Senha:</label>
      <input v-model = "senha" type="password">

      <p v-if = "error"> {{ error }} </p>

    <button class = "btn">
      Entrar
    </button>
  </form>
  </div>
</div>
</template>

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
   router.push('/');
 }
}
</script>

<style>
.caixa {
  background-size: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
form {
  width: 320px;
  height: 20rem;
  background-color: #18181B;
  background-position: center;
  display:flex;  
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  border-radius: 8px;
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
}

label {
  color: #ffffff;
  font-size: 0.9rem;
}

p {
  color: #dd5e5e;
  font-size: 0.9rem;
}

h1 { 
  display: flex;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.amarelo {
  color: #F49D25;
}

.white {
  color: #ffffff;
}



</style>