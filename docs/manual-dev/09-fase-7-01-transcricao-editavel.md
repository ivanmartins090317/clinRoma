# Fase 7 · Fatia F7-01 · Transcrição editável

| Status                  | Spec                                             |
| ----------------------- | ------------------------------------------------ |
| código entregue (F7-01) | `specs/2026-08-25-f7-01-transcricao-editavel.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre só a correção do texto da transcrição.

## O que esta fatia entrega

- Campo de texto na evolução quando a transcrição está **concluída**
- Botão **Salvar correção** (dentista e admin)
- Persistência no mesmo anexo; áudio original inalterado
- Situação permanece **concluída**; não reenfileira o serviço de fala
- Recepção lê o texto e **não** vê o botão

**Não entrega:** busca no histórico (F7-02), anamnese papel, WhatsApp, odontograma cruz, card do paciente, segundo telefone, e-mail financeiro.

---

## Árvore tocada

```text
src/features/records/
├── domain/transcription-edit.ts (+ .test.ts)
├── permissions.ts
├── schemas.ts
├── actions.ts
└── components/
    ├── transcription-status.tsx
    ├── evolution-list.tsx
    └── patient-chart.tsx
```

---

## Fluxo principal

1. Login como dentista (`dentist@clinroma.dev`)
2. Abrir ficha do paciente → aba **Evoluções**
3. Áudio com transcrição concluída (ex.: `extração do dente vinte e quatro`)
4. Alterar para `extração do dente 24` → **Salvar correção**
5. Mensagem **Correção salva.**
6. Recarregar a ficha: o texto corrigido permanece; o player toca o áudio original

Enquanto pendente ou processando, o campo de correção **não** aparece. Se falhou, permanece o botão de retentar da Fase 3.

---

## Matriz

| Ação              | admin | dentist | reception | viewer |
| ----------------- | :---: | :-----: | :-------: | :----: |
| Ver áudio e texto |  Sim  |   Sim   |    Sim    |  Não   |
| Corrigir e salvar |  Sim  |   Sim   |    Não    |  Não   |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia         |
| ------------ | ---------------------- | ----------------------- |
| Dentista     | dentist@clinroma.dev   | Corrigir transcrição    |
| Admin        | admin@clinroma.dev     | Mesma correção          |
| Recepção     | reception@clinroma.dev | Lê; sem botão de salvar |
| Visualizador | viewer@clinroma.dev    | Sem abas clínicas       |

---

## Homologação

Viewport estreito nesta fatia (campo 16 px, botão ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

---

## Referências

- Entrega técnica: [`docs/implementation/F7-01-transcricao-editavel.md`](../implementation/F7-01-transcricao-editavel.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Próximos itens: F7-07, F7-09, F7-02
