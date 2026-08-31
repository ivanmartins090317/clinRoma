# F7-11 · Gestão de acessos pelo admin (módulo Equipe)

| Campo      | Valor                                                   |
| ---------- | ------------------------------------------------------- |
| **Status** | concluída (código) · homologação operacional aberta     |
| **Fase**   | 7 de `docs/PLANO.md` (fase **permanece aberta**)        |
| **Escopo** | criar acesso, trocar papel, ativar/desativar, reenviar convite |

## Objetivo

O papel `admin` já era o gestor no modelo de dados (política `FOR ALL` em `profiles`), mas o poder não era utilizável: faltava `GRANT UPDATE`, não existia módulo de UI e criar login exigia o painel do Supabase. Esta fatia entrega a tela `/equipe`, exclusiva do admin, e fecha um risco de escalonamento de privilégio no trigger de signup.

Exclusão definitiva de colaborador ficou **fora** do escopo: desativar preserva a rastreabilidade das FKs de autoria (`created_by`, `performed_by`, `actor_id`), todas `ON DELETE SET NULL`.

Esta fatia **não** fecha a Fase 7.

## Entregue

### Banco

| Arquivo                                    | Função                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `supabase/migrations/028_team_access_f7.sql` | Hardening do `handle_new_user`, políticas separadas, grant por coluna e trigger de travas |

Conteúdo da migration:

1. `handle_new_user` passa a inserir **sempre** `'viewer'`, ignorando `raw_user_meta_data ->> 'role'`. Antes, com signup público habilitado, alguém poderia se registrar já como `admin`.
2. `profiles_select_admin` (que era `FOR ALL`, sugerindo `INSERT`/`DELETE` que nunca tiveram grant) foi substituída por `profiles_admin_select` (`FOR SELECT`) e `profiles_admin_update` (`FOR UPDATE`).
3. `REVOKE UPDATE` seguido de `GRANT UPDATE (display_name, role, active) ON public.profiles TO authenticated`, sem acesso a `id` nem timestamps. O revoke existe porque a homologação em desenvolvimento mostrou que o remoto **já aceita** `UPDATE` em `profiles`, apesar de a migration `001` conceder apenas `SELECT`: há drift, e grant por coluna não substitui grant de tabela inteira.
4. Trigger `on_profile_update_guard` (`BEFORE UPDATE`) com duas travas que valem mesmo se a action for burlada:
   - alterar o próprio `role` ou `active` levanta exceção;
   - deixar a clínica sem nenhum admin ativo levanta exceção.
5. `updated_at` atualizado no mesmo trigger.

O papel real do colaborador é aplicado depois da criação, com `service_role`, dentro de `provisionCollaborator`.

### Domínio (puro, testável)

| Arquivo                                              | Função                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/features/team/domain/team-guards.ts`            | `canManageTeam`, `isSelfMutation`, `wouldRemoveLastAdmin`, `refuseTeamMutation`, `TEAM_COPY` |
| `src/features/team/domain/temp-password.ts`          | Senha temporária sem caracteres ambíguos (`0`, `O`, `1`, `l`, `I`)        |
| `src/features/team/domain/invite-email-content.ts`   | `subject`, `html`, `text` do convite, com escape de HTML                   |

### Borda

| Arquivo                                              | Função                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `src/features/team/schemas.ts`                       | Zod de convite, troca de papel, ativação e reenvio                    |
| `src/features/team/queries.ts`                       | `listCollaborators` (profiles via RLS + e-mails via `listUsers`), `getCollaboratorStates`, `getCollaboratorEmail` |
| `src/features/team/lib/provision-collaborator.ts`    | `createUser` com `service_role`, aplica papel, `generateLink` de recovery |
| `src/features/team/lib/deliver-invite.ts`            | Link de senha + envio, com falhas nomeadas                            |
| `src/features/team/lib/send-collaborator-invite.ts`  | Envio via Resend já integrado no repo                                 |
| `src/features/team/lib/team-action-context.ts`       | `requireTeamManager`, `logTeamAudit`, `toActionError`                  |
| `src/features/team/actions.ts`                       | `inviteCollaboratorAction`, `changeRoleAction`, `setActiveAction`, `resendInviteAction` |

Troca de papel e ativação usam o **cliente autenticado**, para que RLS e trigger valham como segunda barreira. O `service_role` aparece só no provisionamento inicial e na leitura de e-mails.

Os dois updates terminam em `.select("id").maybeSingle()`: um update barrado por RLS afeta zero linhas **sem** devolver erro, e sem essa checagem a tela mostrava sucesso para uma alteração que não aconteceu. Quando o banco recusa, `describeWriteFailure` traduz a mensagem do trigger ou da permissão para a copy da tela.

### UI

| Arquivo                                                    | Função                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/(app)/equipe/page.tsx`                             | RSC com guarda própria de papel além da guarda do layout      |
| `src/features/team/components/collaborator-list.tsx`        | Lista e área de feedback                                      |
| `src/features/team/components/collaborator-row.tsx`         | Papel, reenvio de convite, desativar/reativar; linha do próprio usuário sem controles |
| `src/features/team/components/collaborator-dialog.tsx`      | Convite nos dois modos de entrega                             |
| `src/features/team/components/temp-password-panel.tsx`      | Senha exibida uma única vez, com botão copiar                  |

### Papéis e superfícies

| Arquivo                            | Função                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| `src/lib/auth/roles.ts`            | Módulo `team`; prefixo `/equipe`; só admin com `write`          |
| `src/lib/auth/guard.ts`            | Rótulo `Equipe` na tela de acesso negado                        |
| `src/types/clinroma.ts`            | Item no catálogo de módulos                                     |
| `src/components/app-shell.tsx`     | Item desktop com ícone `ShieldCheck`; dock mobile **sem** Equipe; `getMobileSecondaryModules` |
| `src/components/mobile-account-menu.tsx` | Botão de conta no celular: módulos fora da dock + Sair     |

A dock mobile continua com cinco ícones. O que fica fora dela (Scan QR, WhatsApp, Equipe) passa a ter caminho pelo botão de conta, que também entrega o logout que faltava no celular.

Correção pontual fora do escopo: `src/components/ui/password-input.tsx` tinha erro de lint pré-existente (interface vazia) que bloqueava a evidência de `npm run lint`.

## Testes automatizados

- Guardas: autorrebaixamento, último admin ativo (inclusive admin inativo não contando como cobertura), alvo inexistente, papel sem permissão
- Senha temporária: tamanho mínimo, ausência de caracteres ambíguos, unicidade entre chamadas
- Convite: rótulo do papel em pt-BR, link nas duas versões, escape de HTML no nome
- Matriz: `/equipe` liberado só para admin, negado para os outros quatro papéis; admin passa a ter 8 módulos
- Dock mobile continua com 5 itens, sem Equipe
- Menu de conta recolhe exatamente o que a dock deixou de fora; nenhum módulo permitido fica sem caminho no celular; papel sem módulo extra não recebe itens
- `describeWriteFailure`: travas do trigger, recusa de permissão, violação de RLS e fallback genérico
- Políticas (`RUN_RLS_TESTS=true`): não-admin não altera `profiles`; admin não altera o próprio papel nem o próprio acesso; admin altera papel de outro colaborador

## Evidências de Done

| Comando         | Resultado                                                        |
| --------------- | ---------------------------------------------------------------- |
| `npm run lint`  | OK · 0 erros · 4 warnings pré-existentes                         |
| `npm test`      | OK · 370 passed, 26 skipped (49 arquivos)                        |
| `npm run build` | OK · Next.js 16.3.1 · rota `/equipe` presente                    |
| `npm run db:push` | **pendente** · migration `028` ainda não aplicada no remoto     |

Homologação exploratória em viewport de celular (390x844), com a conta `admin@clinroma.dev`: menu de conta abre Scan QR, WhatsApp, Equipe e Sair; `/equipe` lista os cinco colaboradores com e-mail e último acesso; desativar e reativar funcionaram e a lista refletiu o novo estado. Como a `028` ainda não está aplicada, as travas de banco **não** foram exercitadas.

## Pendências

- Aplicar `028_team_access_f7.sql` no projeto remoto (`npm run db:push`). Enquanto não for aplicada, o admin consegue rebaixar o próprio papel e deixar a clínica sem administrador ativo
- Homologação manual: criar colaborador nos dois modos, trocar papel, desativar e conferir que o login recusa a conta inativa
- Conferir no painel do Supabase se o signup público está desabilitado (a migration já impede autopromoção, mas o cadastro aberto continua indesejado)
- Confirmar `RESEND_FROM_EMAIL` no ambiente antes de usar o modo convite por e-mail

## Segurança (checklist aplicável)

- Autorização revalidada no servidor em toda action, com guarda também na página
- RLS: `SELECT` e `UPDATE` em `profiles` só para admin; grant limitado a três colunas; sem `INSERT`/`DELETE` para `authenticated`
- Travas de banco independentes da aplicação contra autorrebaixamento e perda do último admin
- Senha temporária nunca é persistida nem registrada no `audit_log`; aparece uma única vez na resposta da action
- Auditoria: `access_granted`, `role_changed`, `access_deactivated`, `access_reactivated`, `invite_resent`, com papel anterior e seguinte
- `service_role` só no servidor (provisionamento e leitura de e-mails), nunca no client
