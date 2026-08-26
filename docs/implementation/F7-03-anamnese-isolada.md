# F7-03 · Anamnese isolada e questionário papel

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7         |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 4                 |
| **Spec**   | `specs/2026-08-26-f7-03-anamnese-isolada.md`       |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)           |

## Objetivo

Substituir o preenchimento **novo** pelo questionário papel (versão 2) e oferecer dois modos isolados para o paciente responder: **pré-consulta** (link, 7 dias) e **consultório** (tablet, até a meia-noite em São Paulo), ambos **sem o menu da clínica**. A equipe continua lendo o histórico na aba Anamnese. Versões v1 de texto livre permanecem consultáveis.

## Entregue

### Domínio

| Arquivo                                                    | Função                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/records/domain/anamnesis-form-v2.ts`         | Questionário papel: ids, textos, Sim/Não, complemento, doenças, mulheres |
| `src/features/records/domain/anamnesis-form-v2.test.ts`    | Vitest: exclusão Sim/Não, complemento, doenças, declaração, contrato do card |
| `src/features/records/lib/anamnesis-token.ts`              | Token opaco, impressão digital, validade por finalidade, rate limit    |
| `src/features/records/lib/anamnesis-token.test.ts`         | Vitest: 7 dias / fim do dia SP, uso único, mensagem genérica           |

`anamnesis-form-v1.ts` e a validade de 12 meses **não** foram alterados.

### Persistência

| Arquivo                                                | Função                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `supabase/migrations/022_anamnesis_convites_f7.sql`    | Tabela `anamnesis_invites` (hash, finalidade, validade, usado), RLS, seed da Maria |
| `src/lib/supabase/database.types.ts`                   | Tipos da tabela e enums `pre_consult` / `office` e `open` / `used` / `revoked` |

Migrations `001`–`021` não foram editadas.

### Borda e UI

| Arquivo                                                        | Função                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/records/permissions.ts`                          | `canGenerateAnamnesisInvite` (espelho de quem grava anamnese)          |
| `src/features/records/schemas.ts`                              | Zod do envio v2, geração de convite e envio público                    |
| `src/features/records/actions.ts`                              | Salvar v2 na ficha; gerar convite; enviar pelo convite (admin client)  |
| `src/features/records/queries.ts`                              | Histórico v1/v2; dados mínimos da página pública                       |
| `src/features/records/components/anamnesis-form.tsx`           | Formulário papel na ficha e no convite                                 |
| `src/features/records/components/anamnesis-yes-no-field.tsx`   | Par Sim/Não + complemento só no Sim                                    |
| `src/features/records/components/anamnesis-disease-list.tsx`   | Lista de doenças + outra doença                                        |
| `src/features/records/components/anamnesis-history.tsx`        | Prévia e leitura de v1 (texto) e v2 (Sim/Não)                          |
| `src/features/records/components/patient-chart.tsx`            | Gerar link pré-consulta e abrir no tablet                              |
| `src/features/records/components/anamnesis-public-header.tsx`  | Cabeçalho Dr. Fellipe na página pública                                |
| `src/app/anamnese/layout.tsx`                                  | Envoltório sem menu da clínica                                         |
| `src/app/anamnese/[token]/page.tsx`                            | Página pública do convite                                              |
| `docs/SECURITY.md`                                             | Superfície `/anamnese/[token]`: token opaco, mínimo de dados, LGPD     |

O recorte do card (F7-09) **não** foi redesenhado. A gravação v2 usa os ids que aquele recorte já lê.

## Testes automatizados

- Questionário: 34 Sim/Não do apêndice; complemento obrigatório no Sim e omitido no Não; doenças vazias válidas; bloco mulheres; declaração; contrato com `parseAnamnesisCardSource`.
- Convite: token longo; só hash persistido; pré-consulta 7 dias; consultório até meia-noite `America/Sao_Paulo`; inválido/expirado/usado com a mesma mensagem; um aberto por finalidade; rate limit.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 214 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                               |
| `npm run build`        | OK · Next.js 16.3.1 · rota `/anamnese/[token]`                                                                           |
| `npm run db:push`      | Falhou por timeout de conexão com o Postgres remoto; migration `022` pronta no repo. Reexecutar `npm run db:push`.      |
| `npm run db:types`     | Tipos da `022` atualizados à mão em `database.types.ts` (CLI exige Docker)                                               |

## Pendências

- Aplicar `022_anamnesis_convites_f7.sql` no projeto remoto (`npm run db:push`) quando a conexão com o banco estiver disponível.
- Homologação em dispositivo real: fechamento da Fase 7 (viewport mobile nesta fatia).
- Envio do link por WhatsApp é F7-04.

## Segurança (checklist aplicável)

- Autorização revalidada na escrita da ficha e na geração do convite (admin, dentist, reception).
- Fail secure: visualizador não vê aba nem gera convite; convite inválido não revela se o paciente existe.
- Página pública sem sessão da equipe; envio usa `service_role` só no servidor após validar o hash.
- Segredo só no link; banco e auditoria sem o valor em claro e sem corpo do questionário.
- Consentimento LGPD visível no convite; limite de tentativas por impressão digital de origem.
- RLS em `anamnesis_invites`: leitura/escrita só para papéis clínicos; anon sem acesso.
