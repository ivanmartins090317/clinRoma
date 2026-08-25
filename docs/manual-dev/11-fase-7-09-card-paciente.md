# Fase 7 · Fatia F7-09 · Card do paciente

| Status                  | Spec                                      |
| ----------------------- | ----------------------------------------- |
| código entregue (F7-09) | `specs/2026-08-25-f7-09-card-paciente.md` |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre só o recorte clínico no topo da ficha.

## O que esta fatia entrega

- Dois blocos no card da ficha, visíveis **sem escolher aba**: **Anamnese** e **Último procedimento**
- Anamnese: data da vigente, recorte (alergias, medicamentos, doenças) e alerta se ausente ou com mais de 12 meses
- Último procedimento: nome da consulta **concluída** mais recente; se faltar nome, trecho da evolução
- Toque no bloco Anamnese abre a aba Anamnese; toque no último procedimento abre Evoluções
- Visualizador **não** vê os blocos (recorte não é montado no servidor)

**Não entrega:** recorte na lista de pacientes, questionário papel na UI (F7-03), escrita pelo card, busca no histórico, odontograma no card.

---

## Árvore tocada

```text
src/features/records/
├── domain/patient-card-summary.ts (+ .test.ts)
├── queries.ts
└── components/patient-chart.tsx

src/features/patients/components/patient-summary.tsx
src/features/agenda/queries.ts
src/app/(app)/pacientes/[id]/page.tsx
supabase/migrations/020_seed_card_paciente_f7.sql
```

---

## Fluxos principais

1. Login como dentista (`dentist@clinroma.dev`)
2. Abrir **Maria Silva** em `/pacientes`
3. Sem tocar em aba: o topo mostra cadastro + anamnese vigente (alergias/medicamentos/doenças do seed) + **Restauração** com data
4. Tocar **Abrir anamnese** vai para a aba Anamnese
5. Voltar ao topo (aba Resumo) e tocar **Abrir evoluções** vai para Evoluções

Paciente recém-cadastrado: `Nenhuma anamnese registrada.` + alerta de 12 meses; `Nenhum procedimento registrado.`; atalhos continuam visíveis para quem lê o prontuário.

---

## Matriz

| Ação                                              | admin | dentist | reception | viewer | auxiliar |
| ------------------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver resumo cadastral no topo                      |  Sim  |   Sim   |    Sim    |  Sim   |   Não    |
| Ver recorte de anamnese e último procedimento     |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Tocar e ir para a aba Anamnese / Evoluções        |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Alterar anamnese ou evolução pelo card            |  Não  |   Não   |   Não   |  Não   |   Não    |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia                         |
| ------------ | ---------------------- | --------------------------------------- |
| Dentista     | dentist@clinroma.dev   | Abrir Maria e ler o card                |
| Recepção     | reception@clinroma.dev | Lê o recorte; atalhos abrem as abas     |
| Visualizador | viewer@clinroma.dev    | Só cadastro; sem os dois blocos         |
| Admin        | admin@clinroma.dev     | Mesma leitura clínica                   |

Paciente seed: **Maria Silva** (`c1000001-0000-4000-8000-000000000001`). Após `npm run db:push`, a consulta concluída `Restauração` (14 dias atrás) alimenta o bloco Último procedimento.

---

## Homologação

Viewport estreito nesta fatia (atalhos 16 px, alvo ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

Após a migration: `npm run db:push`.

---

## Referências

- Implementação: `docs/implementation/F7-09-card-paciente.md`
- Pendências: `docs/state/PENDENCIAS.md`
