# Fase 7 · Fatia F7-03 · Anamnese isolada

| Status                  | Spec                                         |
| ----------------------- | -------------------------------------------- |
| código entregue (F7-03) | `specs/2026-08-26-f7-03-anamnese-isolada.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre o questionário papel e os convites isolados (casa e tablet).

## O que esta fatia entrega

- Formulário **novo** na aba Anamnese: questionário papel Sim/Não (versão 2), não o texto livre da v1
- Histórico misto: v1 continua legível como texto; v2 mostra Sim/Não, doenças e declaração
- **Gerar link pré-consulta**: convite de 7 dias, link copiável. O disparo do link por WhatsApp é F7-04/F7-05.
- **Abrir no tablet**: convite até a meia-noite de São Paulo; a equipe não entra com a própria conta no aparelho
- Página pública `/anamnese/[token]`: cabeçalho do Dr. Fellipe, nome do paciente, questionário, consentimento LGPD; **sem** menu da clínica
- Seed de desenvolvimento: convite pré-consulta da Maria (ver abaixo)

**Não entrega:** WhatsApp (F7-04), campo de sexo, migração de conteúdo v1, redesenho do card (F7-09 já lê a v2), fechamento da Fase 7 inteira.

---

## Árvore tocada

```text
src/features/records/
├── domain/anamnesis-form-v2.ts (+ .test.ts)
├── lib/anamnesis-token.ts (+ .test.ts)
├── permissions.ts
├── schemas.ts
├── queries.ts
├── actions.ts
└── components/
    ├── anamnesis-form.tsx
    ├── anamnesis-yes-no-field.tsx
    ├── anamnesis-disease-list.tsx
    ├── anamnesis-history.tsx
    ├── anamnesis-public-header.tsx
    └── patient-chart.tsx

src/app/anamnese/
├── layout.tsx
└── [token]/page.tsx

supabase/migrations/022_anamnesis_convites_f7.sql
```

---

## Fluxos principais

### Equipe na ficha

1. Login como dentista (`dentist@clinroma.dev`)
2. Abrir **Maria Silva** → aba **Anamnese**
3. Preencher o questionário papel (não os campos de texto livre)
4. Confirmar a declaração, informar o nome, **Salvar nova versão**
5. O histórico lista a v2 nova e a v1 do seed

### Pré-consulta no celular

1. Recepção (`reception@clinroma.dev`) aciona **Gerar link pré-consulta** e copia o link
2. Paciente abre o link **sem login**
3. Vê o cabeçalho, o próprio nome, marca consentimento, preenche e envia
4. Tela `Questionário enviado. Obrigado.`
5. Recarregar o mesmo link: `Link inválido ou expirado.`

### Tablet do consultório

1. Na ficha, **Abrir no tablet**
2. Abrir o link no tablet **sem** a conta da equipe
3. Vale só até a meia-noite de São Paulo

---

## Convite de desenvolvimento

Token em claro (nunca no banco): `clinroma-dev-anamnesis-preconsult-001`

URL local: `https://localhost:3000/anamnese/clinroma-dev-anamnesis-preconsult-001`

Paciente: Maria Silva. Depois do primeiro envio o seed fica usado; gerar outro link na ficha.

A migration `022` precisa estar aplicada (`npm run db:push`).

---

## Matriz

| Ação                                      | admin | dentist | reception | viewer |
| ----------------------------------------- | :---: | :-----: | :-------: | :----: |
| Ver histórico na ficha                    |  Sim  |   Sim   |    Sim    |  Não   |
| Preencher nova versão na ficha            |  Sim  |   Sim   |    Sim    |  Não   |
| Gerar convite e copiar o link             |  Sim  |   Sim   |    Sim    |  Não   |
| Preencher a página do convite (sem login) |  Não  |   Não   |    Não    |  Não   |

Quem tem o **link válido** preenche a página pública, independentemente do papel.

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia              |
| ------------ | ---------------------- | ---------------------------- |
| Dentista     | dentist@clinroma.dev   | Preencher v2 e gerar convite |
| Recepção     | reception@clinroma.dev | Gerar link / abrir no tablet |
| Admin        | admin@clinroma.dev     | Mesmas ações clínicas        |
| Visualizador | viewer@clinroma.dev    | Sem aba Anamnese             |

---

## Homologação

Viewport estreito nesta fatia (campos 16 px, Sim/Não e enviar ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

---

## Referências

- Entrega técnica: [`docs/implementation/F7-03-anamnese-isolada.md`](../implementation/F7-03-anamnese-isolada.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Segurança: [`docs/SECURITY.md`](../SECURITY.md)
- Próximo item: F7-04 (WhatsApp)
