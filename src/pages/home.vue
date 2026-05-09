<template>
  <header class="navbar">
    <div class="navbar-logo">
      <span class="logo-name">Omni<span class="logo-accent">Seg</span></span>
    </div>
    <div class="navbar-right">
      <a href="#funcionalidades" class="nav-link">Funcionalidades</a>
      <a href="#vantagens" class="nav-link">Vantagens</a>
      <a href="#empresas" class="nav-link">Empresas que trabalham conosco</a>
      <a href="#" class="nav-link">Peça uma demonstração</a>
      <RouterLink to="/login">
        <button class="btn-login">Login</button>
      </RouterLink>
    </div>
  </header>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-gradient"></div>
    <div class="hero-content" style="position:absolute;bottom:7rem;left:4rem;z-index:1;text-align:left;">
      <h1 class="hero-title" style="text-align:left;display:block;">PROTEJA.</h1>
      <h1 class="hero-title" style="text-align:left;display:block;">RASTREIE.</h1>
      <h1 class="hero-title" style="text-align:left;display:block;">CONTROLE.</h1>
      <p class="hero-sub">
        reduza custos aumentando controle e eficiência operacional<br />
        na gestão de EPIs com as diversas utilidades do software omniseg
      </p>
    </div>
  </section>

  
  <section class="software">
    <h2 class="software-title">Software completo e intuitivo</h2>
    <p class="software-sub">a evolução digital que sua gestão estava precisando</p>
    <div class="software-inner">
      <RouterLink to="/login">
        <button class="btn-comecar">Começar Agora →</button>
      </RouterLink>
      <div class="video-box">
        <span>video do software aqui</span>
      </div>
    </div>
  </section>


  <section id="funcionalidades" class="funcionalidades">
    <span class="section-tag">FUNCIONALIDADES</span>
    <h2 class="section-title">Tudo o que você precisa para gestão de EPIs</h2>
    <p class="section-sub">Centralize o controle de estoque, entregas e conformidade em uma interface intuitiva e poderosa.</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <h3>Rastreamento de Estoque</h3>
        <p>Controle total do inventário em tempo real. Saiba exatamente quantos EPIs estão em uso, em estoque e quando reabastecer.</p>
      </div>

      <div class="feature-card">
        <div class="icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h3>Alertas Automáticos</h3>
        <p>Receba notificações antes do vencimento do CA (Certificado de Aprovação) ou da vida útil do equipamento entregue ao colaborador.</p>
      </div>

      <div class="feature-card">
        <div class="icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
        </div>
        <h3>Assinatura Digital</h3>
        <p>Elimine o papel. Registre a entrega de EPIs com assinatura biométrica ou digital, garantindo validade jurídica e organização.</p>
      </div>
    </div>
  </section>

  <section class="assinatura-wrap">
    <div class="bio-card">
      <div class="bio-img-side">
        <img src="../assets/prancheta.svg" alt="Entrega de EPI" />
        <span class="bio-badge">✓ Entrega Confirmada</span>
      </div>
      <div class="bio-text-side">
        <h2>Assinatura digital </h2>
        <p>
          Nossa tecnologia exclusiva utiliza assinatura digital validando a
          identidade do colaborador no momento do pedido de retirada do equipamento,
          gerando uma ficha de EPI digital à prova de fraudes.
        </p>
        <ul class="bio-checks">
          <li>
            <span class="check-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Reconhecimento facial biométrico
          </li>
          <li>
            <span class="check-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Geolocalização da entrega
          </li>
          <li>
            <span class="check-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            Atualização de estoque automático
          </li>
        </ul>
        <a href="#" class="link-more">Saiba mais sobre a tecnologia →</a>
      </div>
    </div>
  </section>

  <section id="vantagens" class="vantagens">
    <div class="van-left">
      <span class="section-tag">VANTAGENS</span>
      <h2 class="section-title" style="text-align:left; margin-bottom: 2rem;">Por que escolher OmniSeg?</h2>
      <p class="van-big-text">
        organização total.<br />
        segurança absoluta.<br />
        gastos controlados.
      </p>
      <p class="van-desc">
        Transformamos o controle de equipamentos em algo simples e intuitivo.
        Reforce a segurança da sua equipe com EPIs monitorados e elimine
        surpresas no orçamento com total previsibilidade de gastos.
      </p>
    </div>
    <div class="van-cards">
      <div class="van-card">
        <div class="van-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F49D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h3>Segurança absoluta</h3>
        <p>Avisos automáticos de data de devolução e validade do EPI. Notificações lembrando da necessidade da coleta e devolução.</p>
      </div>
      <div class="van-card">
        <div class="van-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F49D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3>Dados automáticos</h3>
        <p>Dados semanais de média de descarte, uso, preço com fornecedor, custo em tempo real.</p>
      </div>
      <div class="van-card">
        <div class="van-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F49D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <h3>Vigilância em tempo real</h3>
        <p>Monitora quais EPIs estão sendo usados por quem e qual setor, quem fez a retirada, quando devem devolver.</p>
      </div>
      <div class="van-card">
        <div class="van-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F49D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h3>Economia e previsibilidade</h3>
        <p>Planilha gerada semanalmente com quais EPIs devem ser comprados e o custo, mais o custo cadastrado mais barato para os EPIs necessários.</p>
      </div>
    </div>
  </section>


  <section id="empresas" class="empresas">
    <h2>Empresas que confiam no nosso projeto</h2>
    <p>venha fazer parte você também</p>
    <div class="logos-row">
      <img src="../assets/upscalemedia-transformed 1.svg" alt="SENAI" class="logo-senai" />
    </div>
  </section>


  <section class="cta">
    <h2>Pronto para modernizar sua gestão?</h2>
    <p>Junte-se ao software que transformou a segurança no trabalho com tecnologia e automação. Teste grátis por 14 dias.</p>
    <div class="cta-form">
      <input type="email" placeholder="Seu e-mail corporativo" />
      <button class="btn-comecar">Começar grátis</button>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-brand">
      <span class="logo-name footer-logo-name">Omni<span class="logo-accent">Seg</span></span>
      <p>Plataforma focada em gestão de EPIs e<br />segurança do trabalho. Tecnologia que<br />salva vidas.</p>
    </div>
    <div class="footer-col">
      <h4>Produto</h4>
      <a href="#funcionalidades">Funcionalidades</a>
      <a href="#">Integrações</a>
      <a href="#">Preços</a>
      <a href="#">Atualizações</a>
    </div>
    <div class="footer-col">
      <h4>Empresa</h4>
      <a href="#">Sobre Nós</a>
      <a href="#">Carreiras</a>
      <a href="#">Blog</a>
      <a href="#">Contato</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a href="#">Privacidade</a>
      <a href="#">Termos de Uso</a>
      <a href="#">Blog</a>
    </div>
    <div class="footer-social">
      <a href="#" class="social-icon" aria-label="Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </a>
      <a href="#" class="social-icon" aria-label="LinkedIn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      </a>
      <a href="#" class="social-icon" aria-label="Twitter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
        </svg>
      </a>
    </div>
  </footer>
</template>


<script>
export default {
  name: "Home",
};
</script>


<style>
html {
  scroll-behavior: smooth;
}
</style>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

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
  background: rgba(18, 14, 10, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.logo-accent {
  color: #F49D25;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: #9CA3AF;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #ffffff;
}

.btn-login {
  background-color: #F49D25;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.4rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-login:hover {
  background-color: #e08c18;
}

.hero {
  position: relative;
  height: 100vh;
  min-height: 700px;
  background-image: url("../assets/Operarios.svg");
  background-size: cover;
  background-position: center top;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    #1A1612 0%,
    rgba(26, 22, 18, 0.5) 40%,
    rgba(0, 0, 0, 0.15) 100%
  );
}

.hero-content {
  position: absolute;
  bottom: 7rem;
  left: 4rem;
  z-index: 1;
  text-align: left;
}

.hero-title {
  font-size: 6.5rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1;
  margin-bottom: 0.3rem;
  letter-spacing: -0.02em;
  text-align: left;
}

.hero-sub {
  color: #d1d5db;
  font-size: 1.05rem;
  margin-top: 1.2rem;
  line-height: 1.7;
}

.software {
  background: #1A1612;
  padding: 6rem 4rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.software-title {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.software-sub {
  color: #F49D25;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.software-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 62%;
  margin-top: 2rem;
}

.btn-comecar {
  background-color: #F49D25;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.3rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;
  text-decoration: none;
}

.btn-comecar:hover {
  background-color: #e08c18;
}

.video-box {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0c0a08;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.3rem;
  border: 1px solid rgba(244, 157, 37, 0.4);
  box-shadow: 0 0 40px rgba(244, 157, 37, 0.08), inset 0 0 60px rgba(0,0,0,0.6);
}

.funcionalidades {
  background: #1A1612;
  padding: 5rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.section-tag {
  color: #F49D25;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.section-title {
  color: #ffffff;
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 0.5rem;
  letter-spacing: -0.02em;
  text-align: center;
}

.section-sub {
  color: #9CA3AF;
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
  background: #221c16;
  border-radius: 1rem;
  padding: 2rem;
  text-align: left;
  border: 1px solid rgba(255,255,255,0.04);
}

.icon-wrap {
  width: 2.6rem;
  height: 2.6rem;
  background: #F49D25;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.1rem;
  flex-shrink: 0;
}

.feature-card h3 {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}

.feature-card p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.65;
}

.assinatura-wrap {
  background: #1A1612;
  padding: 2rem 4rem 4rem;
}

.bio-card {
  background: #1f1912;
  border-radius: 1.5rem;
  display: flex;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05);
  min-height: 340px;
}

.bio-img-side {
  position: relative;
  width: 42%;
  flex-shrink: 0;
}

.bio-img-side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bio-badge {
  position: absolute;
  bottom: 1.2rem;
  left: 1.2rem;
  background: #F49D25;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.35rem 0.9rem;
  border-radius: 2rem;
}

.bio-text-side {
  padding: 3rem 3rem 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.bio-text-side h2 {
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bio-text-side > p {
  color: #9CA3AF;
  font-size: 0.9rem;
  line-height: 1.65;
  max-width: 480px;
}

.bio-checks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.bio-checks li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #d1d5db;
  font-size: 0.9rem;
}

.check-icon {
  width: 1.3rem;
  height: 1.3rem;
  background: #F49D25;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.link-more {
  color: #F49D25;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.link-more:hover {
  opacity: 0.8;
}

.vantagens {
  background: #1A1612;
  padding: 5rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: start;
}

.van-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.van-left .section-tag {
  display: block;
  margin-bottom: 0.5rem;
}

.van-big-text {
  font-size: 2.1rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.25;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.van-desc {
  color: #9CA3AF;
  font-size: 0.9rem;
  line-height: 1.7;
}

.van-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.van-card {
  background: #221c16;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.04);
}

.van-icon {
  width: 2.6rem;
  height: 2.6rem;
  background: rgba(244, 157, 37, 0.12);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.van-card h3 {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.van-card p {
  color: #6b7280;
  font-size: 0.82rem;
  line-height: 1.55;
}

.empresas {
  background: #100e0b;
  padding: 5rem 4rem;
  text-align: center;
}

.empresas h2 {
  color: #ffffff;
  font-size: 1.9rem;
  font-weight: 700;
}

.empresas > p {
  color: #9CA3AF;
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

.logos-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 3rem;
}

.logo-senai {
  height: 3.5rem;
  filter: brightness(0) invert(1);
  opacity: 0.85;
}

.cta {
  background: #1A1612;
  padding: 6rem 4rem;
  text-align: center;
}

.cta h2 {
  color: #ffffff;
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.cta > p {
  color: #9CA3AF;
  font-size: 0.95rem;
  margin-top: 0.8rem;
  line-height: 1.65;
}

.cta-form {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
}

.cta-form input {
  background: #221c16;
  border: 1px solid #3d3530;
  color: #ffffff;
  padding: 0.7rem 1.2rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  width: 280px;
  outline: none;
  transition: border-color 0.2s;
}

.cta-form input:focus {
  border-color: #F49D25;
}

.cta-form input::placeholder {
  color: #6b7280;
}

.footer {
  background: #0d0b08;
  padding: 3.5rem 4rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 3rem;
  align-items: start;
  border-top: 1px solid #2a2520;
}

.footer-logo-name {
  font-size: 1.2rem;
  display: block;
  margin-bottom: 0.8rem;
}

.footer-brand p {
  color: #6b7280;
  font-size: 0.82rem;
  line-height: 1.7;
}

.footer-col h4 {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.footer-col a {
  display: block;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.82rem;
  margin-bottom: 0.55rem;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #F49D25;
}

.footer-social {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding-top: 0.2rem;
}

.social-icon {
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.social-icon:hover {
  color: #F49D25;
}
</style>
