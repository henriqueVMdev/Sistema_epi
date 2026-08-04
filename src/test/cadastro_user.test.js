// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('../composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: () => ({
        select: () => ({ order: async () => ({ data: [] }) }),
      }),
      auth: {
        signUp: vi.fn(async () => ({ error: null })),
      },
    },
  }),
}))

import CadastroUser from '../pages/cadastro_user.vue'

const montar = () => mount(CadastroUser, {
  global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
})

describe('Página cadastro_user', () => {
  it('renderiza a marca OmniSeg', () => {
    expect(montar().text()).toContain('OmniSeg')
  })

  it('exibe a mensagem de boas-vindas', () => {
    expect(montar().text()).toContain('Registre-se e desfrute do controle e facilidade')
  })

  it('rotula todos os campos do formulário', () => {
    const labels = montar().findAll('label').map(l => l.text())
    expect(labels).toEqual(
      expect.arrayContaining(['Email', 'Senha', 'Nome', 'CPF', 'Setor'])
    )
  })

  // Cada rótulo tem que apontar para um campo que existe. Era exatamente esse
  // o defeito no cadastro_epi: `for` órfão, clique no rótulo não focava nada.
  it('liga cada rótulo a um campo real', () => {
    const w = montar()
    for (const label of w.findAll('label')) {
      const alvo = label.attributes('for')
      expect(alvo, `label "${label.text()}" sem atributo for`).toBeTruthy()
      expect(w.find(`#${alvo}`).exists(), `nenhum campo com id="${alvo}"`).toBe(true)
    }
  })

  it('usa input do tipo password para a senha', () => {
    expect(montar().find('input[type="password"]').exists()).toBe(true)
  })

  it('renderiza o botão "Criar Conta" dentro de um formulário', () => {
    const w = montar()
    expect(w.find('form').exists()).toBe(true)
    expect(w.find('button.btn').text()).toContain('Criar Conta')
  })
})
