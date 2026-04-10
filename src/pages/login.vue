<template>
  <div class="caixa">
    <form @submit.prevent="login">
      <label>Email:</label>
      <input v-model = "email">

      <label>Senha:</label>
      <input v-model = "senha">

    <button class = "btn">
      Entrar
    </button>
  </form>
  </div>
</template>
    

<script>
export default {
  name: "Login"
};
</script>
