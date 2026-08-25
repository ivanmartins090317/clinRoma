# F7-09 · Card do paciente (resumo clínico)

| Campo      | Valor                                       |
| ---------- | ------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7  |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 1          |
| **Spec**   | `specs/2026-08-25-f7-09-card-paciente.md`   |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)    |

## Objetivo

No topo da ficha, abaixo do cadastro, mostrar um **recorte clínico de uma olhada**: anamnese vigente e último procedimento, com alerta se a anamnese passou de 12 meses, e um toque que abre a aba correspondente. O dentista lê o essencial **sem entrar nas abas**.

## Entregue

### Domínio

| Arquivo                                                     | Função                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/records/domain/patient-card-summary.ts`       | Recorte puro: texto livre e questionário papel; último procedimento    |
| `src/features/records/domain/patient-card-summary.test.ts`  | Vitest: recorte, teto de 5 Sim, fallbacks, validade de 12 meses        |

### Persistência

| Arquivo                                          | Função                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `supabase/migrations/020_seed_card_paciente_f7.sql` | Seed incremental: consulta **concluída** no passado da Maria, com nome `Restauração`     |

Sem schema novo. Migrations `001`–`019` não foram editadas.

### Borda e UI

| Arquivo                                                | Função                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `src/features/records/queries.ts`                      | Monta o recorte no servidor; `null` se o papel não lê clínica          |
| `src/features/agenda/queries.ts`                       | Consulta concluída mais recente do paciente                            |
| `src/app/(app)/pacientes/[id]/page.tsx`                | Encaminha o recorte já montado; visualizador não dispara a montagem    |
| `src/features/records/components/patient-chart.tsx`    | Passa o recorte; troca de aba no toque                                 |
| `src/features/patients/components/patient-summary.tsx` | Dois blocos clínicos; esconde se não houver recorte                    |

## Testes automatizados

- Texto livre: alergias, medicamentos, doenças; campos vazios omitidos; `Nenhuma conhecida` permanece.
- Papel: doenças marcadas; Sim com/sem complemento; Não omite linha; Sim relevantes na ordem da spec com teto de 5.
- Validade de 12 meses reutiliza `evaluateAnamnesisExpiry`; expirada mostra recorte + alerta.
- Último procedimento: concluída com nome; sem nome cai na evolução vinculada; só evolução; vazio; trecho ≤ 120.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 161 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                               |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                      |
| `npm run db:push`      | OK · `020_seed_card_paciente_f7.sql` aplicada (aviso Docker de cache local, ignorado) |
| `npm run db:types`     | Não aplicável (sem mudança de schema)                                                                                    |

## Pendências

- Homologação em iPhone/Android reais: fechamento da Fase 7 (viewport mobile nesta fatia).
- Questionário papel na UI é F7-03; o recorte já aceita o formato nos testes de domínio.

## Segurança (checklist aplicável)

- Recorte **não é montado** no servidor para quem não lê clínica (`canViewClinicalContent`).
- Fail secure: visualizador não recebe o DTO; a UI esconde os dois blocos.
- Sem segundo audit só pelo card; a abertura da ficha continua auditando leitura como hoje.
- Logs: em falha de leitura, estado vazio sem corpo de anamnese, trecho de evolução ou CPF.
- Sem segredo no cliente. Sem schema/RLS novo (leitura nas tabelas já cobertas).
