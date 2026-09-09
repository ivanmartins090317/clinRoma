# F7-11b · Edição da Equipe (dados + RBAC recepção)

| Campo      | Valor                                                 |
| ---------- | ----------------------------------------------------- |
| **Status** | concluída (código) · homologação operacional aberta   |
| **Fase**   | 7 de `docs/PLANO.md` (fase **permanece aberta**)      |
| **Spec**   | `specs/2026-09-09-equipe-edicao.md`                   |
| **Pai**    | F7-11 · `docs/implementation/F7-11-gestao-acessos.md` |

## Objetivo

Corrigir e-mail, nome de exibição e ficha de agenda do dentista dentro do ClinRoma, e liberar a **recepção** no dia a dia (modelo B) sem entregar controle de acesso (papel / ativo / convite admin).

Esta fatia **não** fecha a Fase 7.

## Entregue

### Banco

| Arquivo                                    | Função                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `supabase/migrations/029_team_edit_f7.sql` | SELECT de `profiles` para admin + recepção; trigger só admin muda role/active |

### Domínio

| Arquivo                                   | Função                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/features/team/domain/team-guards.ts` | Matriz B: `canAccessTeam`, `canManageAccess`, `canInviteRole`, `canEditCollaboratorData` |
| `src/features/team/schemas.ts`            | `updateCollaboratorProfileSchema`, `updateDentistCardSchema`, cor `#RRGGBB`              |

### Borda

| Arquivo                                        | Função                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/features/team/actions.ts`                 | `updateCollaboratorProfileAction`, `updateDentistCardAction`; convite/reenvio restritos |
| `src/features/team/queries.ts`                 | Lista com vínculo opcional da ficha `dentists`                                          |
| `src/features/team/lib/team-action-context.ts` | `requireTeamAccess` vs `requireTeamAccessManager`                                       |
| `src/lib/auth/roles.ts`                        | `reception.team = "write"`                                                              |

E-mail e nome de exibição via `service_role` (Admin API + update em `profiles`). Ficha de agenda via cliente autenticado (RLS `dentists_write` já inclui recepção).

### UI

| Arquivo                                                     | Função                                     |
| ----------------------------------------------------------- | ------------------------------------------ |
| `src/features/team/components/edit-collaborator-dialog.tsx` | Diálogo de edição de dados                 |
| `src/features/team/components/collaborator-row.tsx`         | Botão Editar; controles de acesso só admin |
| `src/features/team/components/collaborator-dialog.tsx`      | Convite sem opção admin para recepção      |
| `src/app/(app)/equipe/page.tsx`                             | Guarda aceita recepção                     |

Dock mobile **sem** 6º ícone. Equipe continua no menu de conta.

## Testes automatizados

- Guards da matriz B (acesso, gestão, convite, edição de dados)
- Schema de e-mail e cor hex
- Matriz de papéis: recepção com `/equipe`; dentista/auxiliar/viewer sem

## Evidências de Done

| Comando              | Resultado                                                                 |
| -------------------- | ------------------------------------------------------------------------- |
| `npm run lint` (escopo F7-11b) | OK · 0 erros nos arquivos da fatia                               |
| `npx prettier --write` (arquivos da fatia) | Formatados                                               |
| `npm run build`      | OK · Next.js 16.3.1                                                       |
| `npm run test`       | OK · suite Vitest (inclui guards matriz B + schemas)                      |
| `npm run db:push`    | OK · `029_team_edit_f7.sql` aplicada (aviso Docker da CLI ignorado)       |

`npm run lint` no repo inteiro ainda reporta erros pré-existentes fora do escopo (scan de estoque, fila, etc.). `npm run format:check` no repo inteiro falha por drift legado de formatação; os arquivos desta fatia foram formatados com Prettier.

## Pendências

- Homologação manual dos caminhos §8 da spec (recepção edita e-mail/CRO; convite admin negado; etc.)
