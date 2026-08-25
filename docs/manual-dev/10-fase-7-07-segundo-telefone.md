# Fase 7 · Fatia F7-07 · Segundo telefone no cadastro

| Status                  | Spec                                         |
| ----------------------- | -------------------------------------------- |
| código entregue (F7-07) | `specs/2026-08-25-f7-07-segundo-telefone.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre só o segundo telefone opcional no cadastro.

## O que esta fatia entrega

- Campos **Segundo telefone** e **Observação do contato** no cadastro novo e na edição
- Texto de ajuda: parente próximo / paciente mais velho sem WhatsApp
- Resumo cadastral mostra o bloco **só** quando há segundo telefone
- Persistência em `patients.secondary_phone` e `patients.secondary_phone_note`
- Observação sem número é recusada; os dois campos são opcionais no restante

**Não entrega:** lista de pacientes com o segundo número, WhatsApp (F7-04), card clínico (F7-09), máscara de telefone, obrigatoriedade do campo.

---

## Árvore tocada

```text
src/features/patients/
├── domain/secondary-phone.ts (+ .test.ts)
├── schemas.ts
├── actions.ts
├── queries.ts
└── components/
    ├── patient-form.tsx
    └── patient-summary.tsx

supabase/migrations/019_ajustes_demo_f7.sql
```

---

## Fluxos principais

1. Login como recepção (`reception@clinroma.dev`)
2. **Novo paciente:** preencher nome, LGPD e segundo telefone + `filho`
3. **Cadastrar paciente** → ficha com o bloco no resumo
4. Sair e reabrir a ficha: os dados permanecem
5. Edição: apagar os dois campos → **Salvar alterações** → o bloco some do resumo

Cadastro sem segundo telefone continua válido; o resumo não mostra o bloco.

---

## Matriz

| Ação                                | admin | dentist | reception | viewer | auxiliar |
| ----------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver segundo telefone no resumo      |  Sim  |   Sim   |    Sim    |  Sim   |   Não    |
| Incluir ou alterar segundo telefone |  Sim  |   Sim   |    Sim    |  Não   |   Não    |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia              |
| ------------ | ---------------------- | ---------------------------- |
| Recepção     | reception@clinroma.dev | Cadastrar e editar o contato |
| Dentista     | dentist@clinroma.dev   | Mesma escrita                |
| Admin        | admin@clinroma.dev     | Mesma escrita                |
| Visualizador | viewer@clinroma.dev    | Lê o resumo; sem formulário  |

---

## Homologação

Viewport estreito nesta fatia (campo 16 px, botão ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

Após a migration: `npm run db:push`.

---

## Referências

- Entrega técnica: [`docs/implementation/F7-07-segundo-telefone.md`](../implementation/F7-07-segundo-telefone.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Próximos itens: F7-09, F7-02, F7-08
