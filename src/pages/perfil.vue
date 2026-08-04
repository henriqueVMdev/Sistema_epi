<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useMensagem } from '@/composables/mensagem';
import Toast from '@/components/Toast.vue';

const { supabase, perfil, session, recarregarPerfil } = useSupabase();
const { mensagem, mostrarMensagem } = useMensagem();

const form = reactive({ nome: '', email: '', cpf: '' });
const avatarUrl = ref(null);
const arquivo = ref(null);
const previewLocal = ref(null);
const salvando = ref(false);
const enviandoFoto = ref(false);

const preencher = () => {
  if (!perfil.value) return;
  form.nome = perfil.value.nome || '';
  form.email = perfil.value.email || '';
  form.cpf = perfil.value.cpf || '';
  avatarUrl.value = perfil.value.avatar_url || null;
};

onMounted(preencher);
watch(() => perfil.value?.id, preencher);

const selecionarArquivo = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) {
    mostrarMensagem('erro', 'Selecione um arquivo de imagem.');
    return;
  }
  if (f.size > 3 * 1024 * 1024) {
    mostrarMensagem('erro', 'Imagem muito grande (máx. 3 MB).');
    return;
  }
  arquivo.value = f;
  previewLocal.value = URL.createObjectURL(f);
};

const enviarFoto = async () => {
  if (!arquivo.value || !perfil.value) return;
  enviandoFoto.value = true;

  const ext = arquivo.value.name.split('.').pop().toLowerCase();
  const caminho = `${perfil.value.user_id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(caminho, arquivo.value, { upsert: true, cacheControl: '0' });
  if (upErr) {
    enviandoFoto.value = false;
    mostrarMensagem('erro', 'Erro no upload: ' + upErr.message, 7000);
    return;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from('funcionarios')
    .update({ avatar_url: url })
    .eq('id', perfil.value.id);
  if (dbErr) {
    enviandoFoto.value = false;
    mostrarMensagem('erro', 'Foto enviada mas falhou ao salvar: ' + dbErr.message, 7000);
    return;
  }

  avatarUrl.value = url;
  arquivo.value = null;
  previewLocal.value = null;
  enviandoFoto.value = false;
  await recarregarPerfil();
  mostrarMensagem('sucesso', 'Foto de perfil atualizada.');
};

const salvar = async () => {
  if (!perfil.value) return;
  if (!form.nome.trim()) {
    mostrarMensagem('erro', 'O nome não pode ficar vazio.');
    return;
  }
  salvando.value = true;

  const { error: dbErr } = await supabase
    .from('funcionarios')
    .update({ nome: form.nome.trim(), email: form.email.trim(), cpf: form.cpf.trim() })
    .eq('id', perfil.value.id);
  if (dbErr) {
    salvando.value = false;
    mostrarMensagem('erro', 'Erro ao salvar: ' + dbErr.message, 7000);
    return;
  }

  let avisoEmail = '';
  if (form.email.trim() && form.email.trim() !== session.value?.user?.email) {
    const { error: authErr } = await supabase.auth.updateUser({ email: form.email.trim() });
    if (authErr) {
      avisoEmail = ' (mas o email de login não mudou: ' + authErr.message + ')';
    } else {
      avisoEmail = ' Confirme o novo email pela caixa de entrada para concluir a troca de login.';
    }
  }

  salvando.value = false;
  await recarregarPerfil();
  mostrarMensagem('sucesso', 'Perfil atualizado.' + avisoEmail, 7000);
};

const iniciais = (nome) =>
  (nome || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Home <span class="separador">›</span> <span class="atual">Meu Perfil</span></p>
        <h1 class="titulo">Meu <span class="destaque">Perfil</span></h1>
        <p class="subtitulo">Atualize seus dados, email de login e foto.</p>
      </div>
    </header>

    <Toast :mensagem="mensagem" />

    <div class="grade">
      <section class="cartao cartao-foto">
        <div class="avatar-grande">
          <img loading="lazy" decoding="async" v-if="previewLocal || avatarUrl" :src="previewLocal || avatarUrl" alt="Foto de perfil" />
          <span v-else class="avatar-iniciais">{{ iniciais(form.nome) }}</span>
        </div>

        <p class="foto-nome">{{ form.nome || '—' }}</p>
        <p class="foto-role">{{ perfil?.role || '—' }} · {{ perfil?.setor?.nome || 'sem setor' }}</p>

        <label class="btn-escolher">
          Escolher imagem
          <input type="file" accept="image/*" @change="selecionarArquivo" hidden />
        </label>

        <button type="button"
          v-if="arquivo"
          class="btn-salvar"
          :disabled="enviandoFoto"
          @click="enviarFoto"
        >{{ enviandoFoto ? 'Enviando…' : 'Enviar foto' }}</button>

        <p class="foto-dica">PNG ou JPG, até 3 MB.</p>
      </section>

      <section class="cartao">
        <h2 class="cartao-titulo">Dados pessoais</h2>

        <div class="campo">
          <label for="perfil-nome">Nome</label>
          <input id="perfil-nome" v-model="form.nome" type="text" placeholder="Seu nome completo" />
        </div>

        <div class="campo">
          <label for="perfil-email">Email <span class="hint">(também é seu login)</span></label>
          <input id="perfil-email" v-model="form.email" type="email" placeholder="seuemail@exemplo.com" />
        </div>

        <div class="campo">
          <label for="perfil-cpf">CPF</label>
          <input id="perfil-cpf" v-model="form.cpf" type="text" placeholder="000.000.000-00" />
        </div>

        <div class="campo campo-leitura">
          <label for="perfil-role">Função</label>
          <input id="perfil-role" :value="perfil?.role || '—'" disabled />
        </div>

        <button type="button" class="btn-salvar btn-largo" :disabled="salvando" @click="salvar">
          {{ salvando ? 'Salvando…' : 'Salvar alterações' }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pagina {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  padding: 2rem 3rem 3rem;
  box-sizing: border-box;
  width: 100%;
}
.pagina *, .pagina *::before, .pagina *::after { box-sizing: border-box; }

.cabecalho { margin-bottom: 1.8rem; }
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: var(--texto-forte); }
.titulo { font-size: 2.4rem; font-weight: 800; margin-bottom: 0.3rem; letter-spacing: -0.02em; }
.destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.9rem; }

.grade { display: grid; grid-template-columns: 300px 1fr; gap: 1.2rem; align-items: start; }

.cartao {
  background: var(--superficie-elevada); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem; padding: 1.6rem;
}
.cartao-titulo { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.4rem; }

.cartao-foto { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
.avatar-grande {
  width: 130px; height: 130px; border-radius: 50%;
  overflow: hidden; background: var(--borda-forte);
  border: 3px solid color-mix(in srgb, var(--marca) 50%, transparent);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.4rem;
}
.avatar-grande img { width: 100%; height: 100%; object-fit: cover; }
.avatar-iniciais { color: var(--marca); font-size: 2.6rem; font-weight: 800; }
.foto-nome { color: var(--texto-forte); font-size: 1.15rem; font-weight: 700; }
.foto-role { color: var(--texto-suave); font-size: 0.82rem; text-transform: capitalize; margin-bottom: 0.6rem; }

.btn-escolher {
  display: inline-block; cursor: pointer;
  background: color-mix(in srgb, var(--marca) 12%, transparent); color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  padding: 0.5rem 1.1rem; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 700;
}
.btn-escolher:hover { background: color-mix(in srgb, var(--marca) 22%, transparent); }
.foto-dica { color: var(--texto-fraco); font-size: 0.72rem; margin-top: 0.3rem; }

.campo { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.1rem; }
.campo label { color: var(--texto); font-size: 0.85rem; font-weight: 600; }
.campo label .hint { color: var(--texto-fraco); font-weight: 400; }
.campo input {
  background: var(--superficie); border: 1px solid var(--borda); color: var(--texto-forte);
  padding: 0.7rem 0.85rem; border-radius: 0.5rem; font-size: 0.92rem;
  outline: none; transition: border-color 0.15s; font-family: inherit;
}
.campo input:focus { border-color: var(--marca); }
.campo-leitura input { color: var(--texto-suave); cursor: not-allowed; text-transform: capitalize; }

.btn-salvar {
  background: var(--marca); color: var(--marca-texto); border: none;
  padding: 0.65rem 1.2rem; border-radius: 0.55rem;
  font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s;
}
.btn-salvar:hover:not(:disabled) { background: var(--marca-escura); }
.btn-salvar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-largo { width: 100%; margin-top: 0.4rem; padding: 0.8rem; }


@media (max-width: 760px) {
  .pagina { padding: 1.5rem 1.2rem 2rem; }
  .titulo { font-size: 1.8rem; }
  .grade { grid-template-columns: 1fr; }
}
</style>
