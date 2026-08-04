<script setup>
import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#vantagens', label: 'Vantagens' },
  { href: '#empresas', label: 'Empresas' },
];

const menuAberto = ref(false);

// fecha a gaveta ao navegar para uma âncora
watch(menuAberto, (v) => {
  document.body.style.overflow = v ? 'hidden' : '';
});
</script>

<template>
  <a class="pular-para-conteudo" href="#funcionalidades">Pular para o conteúdo</a>

  <header class="navbar">
    <span class="logo-name">Omni<span class="logo-accent">Seg</span></span>

    <nav class="navbar-right" aria-label="Navegação da página">
      <a v-for="l in LINKS" :key="l.href" :href="l.href" class="nav-link">{{ l.label }}</a>
      <RouterLink to="/login" class="btn-login">Entrar</RouterLink>

      <button
        type="button"
        class="btn-menu"
        :aria-expanded="menuAberto"
        aria-controls="menu-home"
        :aria-label="menuAberto ? 'Fechar menu' : 'Abrir menu'"
        @click="menuAberto = !menuAberto"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <template v-if="menuAberto">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </template>
          <template v-else>
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </template>
        </svg>
      </button>
    </nav>
  </header>

  <div v-if="menuAberto" id="menu-home" class="menu-mobile">
    <a v-for="l in LINKS" :key="l.href" :href="l.href" @click="menuAberto = false">{{ l.label }}</a>
    <RouterLink to="/login" class="menu-mobile-cta">Entrar</RouterLink>
  </div>

  <section class="hero">
    <div class="hero-gradient"></div>
    <div class="hero-content">
      <h1 class="hero-title">
        <span>Proteja.</span>
        <span>Rastreie.</span>
        <span>Controle.</span>
      </h1>
      <p class="hero-sub">
        Reduza custos aumentando controle e eficiência operacional
        na gestão de EPIs com as diversas utilidades do software OmniSeg.
      </p>
      <div class="hero-acoes">
        <RouterLink to="/cadastro_user" class="btn-primario">Criar uma conta</RouterLink>
        <a href="#funcionalidades" class="btn-secundario">Ver funcionalidades</a>
      </div>
    </div>
  </section>

  <main>
    <section id="funcionalidades" class="funcionalidades">
      <span class="section-tag">FUNCIONALIDADES</span>
      <h2 class="section-title">Tudo o que você precisa para gestão de EPIs</h2>
      <p class="section-sub">Centralize o controle de estoque, entregas e conformidade em uma interface intuitiva e poderosa.</p>
      <div class="features-grid">
        <article class="feature-card">
          <div class="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h3>Rastreamento de Estoque</h3>
          <p>Controle total do inventário em tempo real. Saiba exatamente quantos EPIs estão em uso, em estoque e quando reabastecer.</p>
        </article>

        <article class="feature-card">
          <div class="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3>Alertas Automáticos</h3>
          <p>Receba notificações antes do vencimento do CA (Certificado de Aprovação) ou da vida útil do equipamento entregue ao colaborador.</p>
        </article>

        <article class="feature-card">
          <div class="icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </div>
          <h3>Assinatura Digital</h3>
          <p>Elimine o papel. Registre a entrega de EPIs com assinatura biométrica ou digital, garantindo validade jurídica e organização.</p>
        </article>
      </div>
    </section>

    <section class="assinatura-wrap">
      <div class="bio-card">
        <div class="bio-img-side">
          <img src="../assets/prancheta.webp" width="512" height="512" loading="lazy" decoding="async" alt="Colaborador de colete refletivo assinando a retirada de um EPI em um tablet" />
          <span class="bio-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Entrega Confirmada
          </span>
        </div>
        <div class="bio-text-side">
          <h2>Entrega facilitada</h2>
          <p>
            Nossa tecnologia exclusiva utiliza assinatura digital validando a
            identidade do colaborador no momento do pedido de retirada do equipamento,
            gerando uma ficha de EPI digital à prova de fraudes.
          </p>
          <ul class="bio-checks">
            <li v-for="item in ['Rastreio de cadastro por setor', 'Histórico de retiradas', 'Atualização de estoque automática']" :key="item">
              <span class="check-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section id="vantagens" class="vantagens">
      <div class="van-left">
        <span class="section-tag">VANTAGENS</span>
        <h2 class="section-title section-title-esq">Por que escolher OmniSeg?</h2>
        <p class="van-big-text">
          Organização total.<br />
          Segurança absoluta.<br />
          Gastos controlados.
        </p>
        <p class="van-desc">
          Transformamos o controle de equipamentos em algo simples e intuitivo.
          Reforce a segurança da sua equipe com EPIs monitorados e elimine
          surpresas no orçamento com total previsibilidade de gastos.
        </p>
      </div>
      <div class="van-cards">
        <article class="van-card">
          <div class="van-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--marca)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3>Segurança absoluta</h3>
          <p>Avisos automáticos de data de devolução e validade do EPI. Notificações lembrando da necessidade da coleta e devolução.</p>
        </article>
        <article class="van-card">
          <div class="van-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--marca)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h3>Dados automáticos</h3>
          <p>Dados semanais de média de descarte, uso, preço com fornecedor, custo em tempo real.</p>
        </article>
        <article class="van-card">
          <div class="van-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--marca)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h3>Vigilância em tempo real</h3>
          <p>Monitora quais EPIs estão sendo usados por quem e qual setor, quem fez a retirada, quando devem devolver.</p>
        </article>
        <article class="van-card">
          <div class="van-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--marca)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h3>Economia e previsibilidade</h3>
          <p>Planilha gerada semanalmente com quais EPIs devem ser comprados e o custo, mais o custo cadastrado mais barato para os EPIs necessários.</p>
        </article>
      </div>
    </section>

    <section id="empresas" class="empresas">
      <h2>Empresas que confiam no nosso projeto</h2>
      <p>Venha fazer parte você também.</p>
      <div class="logos-row">
        <img loading="lazy" decoding="async" src="/senai.svg" alt="SENAI" class="logo-senai" />
      </div>
    </section>

    <section class="cta">
      <h2>Pronto para modernizar sua gestão?</h2>
      <p>Junte-se ao software que transformou a segurança no trabalho com tecnologia e automação.</p>
      <div class="cta-acoes">
        <RouterLink to="/cadastro_user" class="btn-primario">Criar uma conta</RouterLink>
        <RouterLink to="/login" class="btn-secundario">Já tenho conta</RouterLink>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-brand">
      <span class="footer-logo-name">
        <img loading="lazy" decoding="async" src="@/assets/Logo_branco.svg" alt="" class="footer-logo-img" />Omni<span class="logo-accent">Seg</span>
      </span>
      <p>Plataforma focada em gestão de EPIs e segurança do trabalho. Tecnologia que salva vidas.</p>
    </div>

    <nav class="footer-col" aria-label="Seções do site">
      <h2>Produto</h2>
      <a v-for="l in LINKS" :key="l.href" :href="l.href">{{ l.label }}</a>
    </nav>

    <div class="footer-col">
      <h2>Projeto</h2>
      <p class="footer-texto">Trabalho desenvolvido no SENAI para a gestão de EPIs em ambiente de oficina e laboratório.</p>
    </div>

    <nav class="footer-col" aria-label="Acesso">
      <h2>Acesso</h2>
      <RouterLink to="/login">Entrar</RouterLink>
      <RouterLink to="/cadastro_user">Criar uma conta</RouterLink>
    </nav>
  </footer>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 4rem;
  background: color-mix(in srgb, var(--superficie-fundo) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
}

.logo-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--texto-forte);
  letter-spacing: -0.02em;
}
.logo-accent { color: var(--marca); }

.navbar-right { display: flex; align-items: center; gap: 2rem; }

.nav-link {
  color: var(--texto-suave);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}
.nav-link:hover { color: var(--texto-forte); }

.btn-login {
  background: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: var(--raio-sm);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-login:hover { background: var(--marca-escura); }

.btn-menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: transparent;
  border: 1px solid var(--borda-forte);
  border-radius: var(--raio-sm);
  color: var(--texto-forte);
  cursor: pointer;
}

.menu-mobile {
  display: none;
  position: fixed;
  top: 4.4rem;
  left: 0;
  right: 0;
  z-index: 99;
  flex-direction: column;
  padding: 0.6rem 1.5rem 1.2rem;
  background: var(--superficie-elevada);
  border-bottom: 1px solid var(--borda);
}
.menu-mobile a {
  display: flex;
  align-items: center;
  min-height: 3rem;
  color: var(--texto);
  text-decoration: none;
  font-size: 1rem;
  border-bottom: 1px solid var(--borda);
}
.menu-mobile-cta {
  justify-content: center;
  margin-top: 0.9rem;
  background: var(--marca);
  color: var(--marca-texto) !important;
  border: none !important;
  border-radius: var(--raio-sm);
  font-weight: 700;
}

.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background-image: url("../assets/Operarios.webp");
  background-size: cover;
  background-position: center top;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--superficie-alta) 0%,
    color-mix(in srgb, var(--superficie-alta) 55%, transparent) 40%,
    color-mix(in srgb, var(--superficie-fundo) 18%, transparent) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 9rem 4rem 7rem;
  max-width: 46rem;
}

.hero-title {
  display: flex;
  flex-direction: column;
  font-size: clamp(2.75rem, 9vw, 6.5rem);
  font-weight: 900;
  color: var(--texto-forte);
  line-height: 1;
  letter-spacing: -0.03em;
}

.hero-sub {
  color: var(--texto);
  font-size: 1.05rem;
  margin-top: 1.4rem;
  line-height: 1.7;
  max-width: 34rem;
}

.hero-acoes,
.cta-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 2rem;
}
.cta-acoes { justify-content: center; }

.btn-primario,
.btn-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  padding: 0.75rem 1.6rem;
  border-radius: var(--raio-sm);
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;
}
.btn-primario { background: var(--marca); color: var(--marca-texto); }
.btn-primario:hover { background: var(--marca-escura); }
.btn-secundario {
  background: transparent;
  color: var(--texto-forte);
  border: 1px solid var(--borda-forte);
}
.btn-secundario:hover { border-color: var(--marca); color: var(--marca); }

.funcionalidades {
  background: var(--superficie-alta);
  padding: 5rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.section-tag {
  color: var(--marca);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.section-title {
  color: var(--texto-forte);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 700;
  margin-top: 0.5rem;
  letter-spacing: -0.02em;
}

.section-sub {
  color: var(--texto-suave);
  font-size: 0.95rem;
  margin-top: 0.6rem;
  max-width: 560px;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;
  width: 100%;
  max-width: 1100px;
}

.feature-card {
  background: var(--superficie-elevada);
  border-radius: var(--raio);
  padding: 2rem;
  text-align: left;
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
}

.icon-wrap {
  width: 2.6rem;
  height: 2.6rem;
  background: var(--marca);
  color: var(--marca-texto);
  border-radius: var(--raio-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.1rem;
  flex-shrink: 0;
}

.feature-card h3 {
  color: var(--texto-forte);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.feature-card p { color: var(--texto-fraco); font-size: 0.875rem; line-height: 1.65; }

.assinatura-wrap { background: var(--superficie-alta); padding: 2rem 4rem 4rem; }

.bio-card {
  background: var(--superficie-alta);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  padding: 2rem;
  gap: 2rem;
}

.bio-img-side {
  position: relative;
  flex: 0 0 auto;
  width: clamp(280px, 36%, 420px);
  align-self: center;
}
.bio-img-side img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--raio);
  box-shadow: 0 18px 40px -12px rgb(0 0 0 / 0.65);
}

.bio-badge {
  position: absolute;
  bottom: 1.2rem;
  left: 1.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--marca);
  color: var(--marca-texto);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.4rem 0.9rem;
  border-radius: var(--raio-pill);
}

.bio-text-side {
  flex: 1;
  padding: 1rem 1rem 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}
.bio-text-side h2 {
  color: var(--texto-forte);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.bio-text-side > p { color: var(--texto-suave); font-size: 0.9rem; line-height: 1.65; max-width: 480px; }

.bio-checks { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
.bio-checks li { display: flex; align-items: center; gap: 0.7rem; color: var(--texto); font-size: 0.9rem; }

.check-icon {
  width: 1.3rem;
  height: 1.3rem;
  background: var(--marca);
  color: var(--marca-texto);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vantagens {
  background: var(--superficie-alta);
  padding: 5rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: start;
}

.van-left { display: flex; flex-direction: column; }
.section-title-esq { text-align: left; margin-bottom: 2rem; }
.van-left .section-tag { display: block; margin-bottom: 0.5rem; }

.van-big-text {
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 700;
  color: var(--texto-forte);
  line-height: 1.25;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}
.van-desc { color: var(--texto-suave); font-size: 0.9rem; line-height: 1.7; }

.van-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.van-card {
  background: var(--superficie-elevada);
  border-radius: var(--raio);
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
}

.van-icon {
  width: 2.6rem;
  height: 2.6rem;
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  border-radius: var(--raio-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.van-card h3 { color: var(--texto-forte); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
.van-card p { color: var(--texto-fraco); font-size: 0.82rem; line-height: 1.55; }

.empresas { background: var(--superficie-fundo); padding: 5rem 4rem; text-align: center; }
.empresas h2 { color: var(--texto-forte); font-size: clamp(1.4rem, 3.5vw, 1.9rem); font-weight: 700; }
.empresas > p { color: var(--texto-suave); margin-top: 0.5rem; font-size: 0.95rem; }

.logos-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; margin-top: 3rem; gap: 3rem; }
.logo-senai { height: 3.5rem; filter: brightness(0) invert(1); opacity: 0.85; }

.cta { background: var(--superficie-alta); padding: 6rem 4rem; text-align: center; }
.cta h2 { color: var(--texto-forte); font-size: clamp(1.6rem, 4.5vw, 2.4rem); font-weight: 700; letter-spacing: -0.02em; }
.cta > p { color: var(--texto-suave); font-size: 0.95rem; margin-top: 0.8rem; line-height: 1.65; }

.footer {
  background: var(--superficie-fundo);
  padding: 3.5rem 4rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1.4fr 1fr;
  gap: 3rem;
  align-items: start;
  border-top: 1px solid var(--borda);
}

.footer-logo-name {
  font-size: 1.2rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  color: var(--texto-forte);
}
.footer-logo-img { width: 1.6rem; height: 1.6rem; object-fit: contain; }
.footer-brand p { color: var(--texto-fraco); font-size: 0.82rem; line-height: 1.7; max-width: 22rem; }

.footer-col { display: flex; flex-direction: column; }
.footer-col h2 { color: var(--texto-forte); font-size: 0.9rem; font-weight: 700; margin-bottom: 1rem; }
.footer-col a {
  display: flex;
  align-items: center;
  min-height: 2.25rem;
  color: var(--texto-fraco);
  text-decoration: none;
  font-size: 0.82rem;
  transition: color 0.2s;
}
.footer-col a:hover { color: var(--marca); }
.footer-texto { color: var(--texto-fraco); font-size: 0.82rem; line-height: 1.7; }

@media (max-width: 900px) {
  .navbar { padding: 1rem 1.5rem; }
  .navbar-right { gap: 0.7rem; }
  .nav-link { display: none; }
  .btn-menu { display: flex; }
  .menu-mobile { display: flex; }

  .hero { min-height: 34rem; }
  .hero-content { padding: 8rem 1.5rem 3.5rem; }

  .funcionalidades,
  .vantagens,
  .empresas,
  .cta { padding: 3.5rem 1.5rem; }

  .features-grid { grid-template-columns: 1fr; }

  .assinatura-wrap { padding: 2rem 1.5rem 3rem; }
  .bio-card { flex-direction: column; padding: 1.5rem; }
  .bio-img-side { width: 100%; max-width: 420px; }
  .bio-text-side { padding: 1rem 0 0; }

  .vantagens { grid-template-columns: 1fr; gap: 2.5rem; }
  .van-cards { grid-template-columns: 1fr 1fr; }

  .footer { grid-template-columns: 1fr 1fr; gap: 2rem; padding: 3rem 1.5rem; }
}

@media (max-width: 520px) {
  .van-cards { grid-template-columns: 1fr; }
  .footer { grid-template-columns: 1fr; }
  .hero-acoes .btn-primario,
  .hero-acoes .btn-secundario,
  .cta-acoes .btn-primario,
  .cta-acoes .btn-secundario { flex: 1 1 100%; }
}
</style>
