<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useSupabase } from '../composables/useSupabase';
const email = ref('');
const senha = ref('');
const { supabase } = useSupabase();
const error = ref('');
const router = useRouter();

const entrando = ref(false);

async function login() {
  if (entrando.value) return;
  error.value = '';
  if (!email.value.trim() || !senha.value) {
    error.value = 'Informe email e senha.';
    return;
  }
  entrando.value = true;
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: senha.value
  })
  entrando.value = false;

  if (authError) {
    error.value = authError.message;
  } else {
    // estoque é acessível a todos os perfis; o guard redireciona quem tem mais acesso
    router.push('/estoque');
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
        <label for="login-email">Email:</label>
        <input id="login-email" v-model = "email" type="email" autocomplete="email">
      </div>

      <div class = "campo">
        <label for="login-senha">Senha:</label>
        <input id="login-senha" v-model = "senha" type="password" autocomplete="current-password">
      </div>

      <p class="error" role="alert" v-if="error"> {{ error }} </p>

    

    <button class = "btn" type="submit" :disabled="entrando">
      {{ entrando ? 'Entrando…' : 'Entrar na Plataforma' }}
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
  width: 100%;
  max-width: 25rem;
  background-color: var(--superficie) !important;
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

input{
  justify-content: center;
  color: var(--texto-forte);
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px;
  gap: 2px;
  border: none;
  border: 1px solid var(--borda);
  outline: none;
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