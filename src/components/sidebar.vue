<template>
  <!-- Container principal que divide a tela em Sidebar + Conteúdo -->
  <div class="shell">
    <!-- ===== SIDEBAR: Menu lateral fixo ===== -->
    <!-- A Sidebar fica fixa na esquerda enquanto o conteúdo rola -->
    <aside class="sidebar">
      <!-- Logo/Título do sistema -->
      <h1 class="logo">
        <i class="fas fa-shield-alt"></i>
        Sistema EPI
      </h1>

      <!-- Menu de navegação -->
      <!-- RouterLink: links especiais do Vue Router que navegam sem recarregar a página -->
      <nav class="menu">
  <RouterLink to="/cadastro_epi" class="menu-item" active-class="active">
    <i class="fas fa-users"></i>
    <span>Cadastro de EPI</span>
  </RouterLink>

  <RouterLink to="/controle_EPI" class="menu-item" active-class="active">
    <i class="fas fa-users"></i>
    <span>Controle de EPI</span>
  </RouterLink>

</nav>

      <!-- Botão de logout -->
      <!-- @click="sair" = quando o usuário clica, chama a função sair() -->
      <button @click="sair" class="botao-sair">
        <i class="fas fa-sign-out-alt"></i>
        <span>Sair</span>
      </button>
    </aside>

    <!-- ===== CONTEÚDO CENTRAL ===== -->
    <!-- Aqui é onde as páginas aparecem (Dashboard, Funcionários, etc.) -->
    <main class="conteudo">
      <!-- RouterView: espaço vazio onde o Vue coloca o componente da rota atual -->
      <!-- Cada rota filha (children) aparece aqui automaticamente -->
      <RouterView />
    </main>
  </div>
</template>

<script setup>
// ===== IMPORTAÇÕES =====
// Importar o composable do Supabase que já está configurado no projeto
// useSupabase() = retorna o cliente Supabase pronto para usar
import { useSupabase } from '@/composables/useSupabase'

// Importar o router do Vue Router para navegar entre páginas
// useRouter() = permite usar router.push() para ir para outras páginas
import { useRouter } from 'vue-router'

// Importar os componentes especiais do Vue Router
// RouterLink = componente que cria links que navegam sem recarregar
// RouterView = componente que mostra o conteúdo da rota atual
import { RouterLink, RouterView } from 'vue-router'

// ===== CONFIGURAÇÃO =====
// Pegar o cliente Supabase já configurado
// supabase = objeto que tem os métodos para autenticação, banco de dados, etc
const { supabase } = useSupabase()

// Pegar o router para navegar entre páginas
// router = objeto que permite router.push('/pagina') para navegar
const router = useRouter()

// ===== FUNÇÃO: FAZER LOGOUT =====
// Esta função é chamada quando o usuário clica no botão "Sair"
// Ela desconecta o usuário do Supabase e o redireciona para a página de login
async function sair() {
  // try = tenta executar o código dentro
  // Se houver um erro, vai para o catch
  try {
    // ===== PASSO 1: DESCONECTAR DO SUPABASE =====
    // supabase.auth.signOut() = função do Supabase que desconecta o usuário
    // Isso remove a sessão do usuário do navegador
    // await = espera a operação terminar antes de continuar
    await supabase.auth.signOut()
    // Depois de desconectar, o usuário não está mais autenticado
    // Se tentar acessar uma página protegida, será redirecionado para login

    // ===== PASSO 2: REDIRECIONAR PARA A PÁGINA DE LOGIN =====
    // router.push('/login') = navega para a página /login
    // Isso leva o usuário de volta para a tela de login
    // A navegação acontece sem recarregar a página (SPA)
    router.push('/login')
    // Agora o usuário está na página de login e pode fazer login novamente
  }
  // catch = captura qualquer erro que aconteça no try
  catch (err) {
    // Se houver um erro ao fazer logout, mostrar no console
    // Isso ajuda o desenvolvedor a entender o que deu errado
    console.error('Erro ao fazer logout:', err)
    // Nota: mesmo com erro, o usuário pode estar desconectado
    // Mas é bom avisar o desenvolvedor sobre o problema
  }
}
</script>

<style scoped>
/* ===== ESTILOS GERAIS ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ===== CONTAINER PRINCIPAL: SHELL ===== */
/* Divide a tela em duas colunas: Sidebar (esquerda) + Conteúdo (direita) */
.shell {
  display: flex;
  /* flex = coloca os elementos lado a lado */
  height: 100vh;
  /* 100vh = ocupa toda a altura da tela */
  background-color: #79772d;
}

/* ===== SIDEBAR: Menu lateral fixo ===== */
/* A Sidebar fica presa no lugar enquanto o conteúdo rola */
.sidebar {
  width: 250px;
  /* Largura fixa de 250px */
  background-color: #003D99;
  /* Azul escuro como fundo */
  color: #FFFFFF;
  /* Texto branco */
  padding: 30px 20px;
  /* Espaço interno */
  display: flex;
  /* Coloca os itens em coluna */
  flex-direction: column;
  position: fixed;
  /* Fica fixo enquanto o conteúdo rola */
  height: 100vh;
  /* Ocupa toda a altura da tela */
  left: 0;
  /* Posição na esquerda */
  top: 0;
  /* Posição no topo */
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  /* Sombra suave na direita da Sidebar */
  z-index: 1000;
  /* Fica acima de outros elementos */
  overflow-y: auto;
  /* Permite rolar se o conteúdo for muito grande */
}

/* ===== LOGO ===== */
/* Título do sistema na Sidebar */
.logo {
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 40px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* Ícone do logo */
.logo i {
  font-size: 28px;
}

/* ===== MENU DE NAVEGAÇÃO ===== */
/* Container que envolve todos os links do menu */
.menu {
  flex-grow: 1;
  /* Ocupa todo o espaço disponível */
  display: flex;
  flex-direction: column;
  /* Coloca os itens em coluna (um embaixo do outro) */
  gap: 10px;
  /* Espaço entre os itens */
}

/* ===== ITENS DO MENU ===== */
/* Estilo de cada link do menu */
.menu-item {
  display: flex;
  /* Coloca o ícone e o texto lado a lado */
  align-items: center;
  padding: 15px 20px;
  color: #FFFFFF;
  text-decoration: none;
  /* Remove o sublinhado padrão dos links */
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  /* Muda o cursor para "mão" quando passa */
  transition: all 0.3s ease;
  /* Animação suave ao mudar de estado */
  gap: 12px;
  /* Espaço entre o ícone e o texto */
}

/* Quando passa o mouse no item do menu */
.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  /* Fundo branco translúcido */
}

/* Quando o item está ativo (a página atual) */
.menu-item.active {
  background-color: rgba(255, 255, 255, 0.2);
  /* Fundo branco mais opaco */
  font-weight: 600;
  /* Texto em negrito */
  border-left: 4px solid #FFFFFF;
  /* Borda branca na esquerda */
  padding-left: 16px;
  /* Reduz o padding para compensar a borda */
}

/* Ícone do menu */
.menu-item i {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

/* ===== BOTÃO SAIR ===== */
/* Botão de logout na parte inferior da Sidebar */
.botao-sair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  /* Fundo branco translúcido */
  color: #FFFFFF;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  /* Ocupa toda a largura da Sidebar */
}

/* Quando passa o mouse no botão Sair */
.botao-sair:hover {
  background-color: rgba(255, 255, 255, 0.2);
  /* Fundo mais opaco */
}

/* Quando clica no botão Sair */
.botao-sair:active {
  transform: scale(0.98);
  /* Diminui um pouco o tamanho */
}

/* Ícone do botão Sair */
.botao-sair i {
  font-size: 18px;
}

/* ===== CONTEÚDO CENTRAL ===== */
/* Área principal onde as páginas aparecem */
.conteudo {
  flex-grow: 1;
  /* Ocupa todo o espaço restante */
  margin-left: 250px;
  /* Deixa espaço para a Sidebar fixa (250px) */
  padding: 30px;
  /* Espaço interno */
  overflow-y: auto;
  /* Permite rolar o conteúdo se necessário */
  background-color: #FFFFFF;
}

/* ===== RESPONSIVIDADE: Telas pequenas (celulares) ===== */
@media (max-width: 768px) {
  /* Em telas pequenas, a Sidebar fica escondida ou reduzida */
  .sidebar {
    width: 200px;
    /* Reduz a largura da Sidebar */
  }

  .conteudo {
    margin-left: 200px;
    /* Ajusta o espaço para a nova largura */
    padding: 20px;
    /* Reduz o padding */
  }

  .logo {
    font-size: 20px;
    margin-bottom: 30px;
  }

  .menu-item {
    padding: 12px 15px;
    font-size: 14px;
  }
}

/* ===== RESPONSIVIDADE: Telas muito pequenas (celulares pequenos) ===== */
@media (max-width: 480px) {
  /* Em telas muito pequenas, a Sidebar pode ser ocultada com JavaScript */
  .sidebar {
    width: 100%;
    position: absolute;
    height: auto;
  }

  .conteudo {
    margin-left: 0;
    padding: 15px;
  }
}
</style>
