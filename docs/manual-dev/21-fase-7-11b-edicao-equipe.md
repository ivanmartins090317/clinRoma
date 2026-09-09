# Fase 7 · Fatia F7-11b · Edição da Equipe

| Status                   | Registro                                      |
| ------------------------ | --------------------------------------------- |
| código entregue (F7-11b) | `docs/implementation/F7-11b-edicao-equipe.md` |
| spec                     | `specs/2026-09-09-equipe-edicao.md`           |

Extensão da F7-11. A Fase 7 inteira **ainda está aberta**.

## O que esta fatia entrega

- Admin e **recepção** abrem `/equipe` pelo menu de conta (dock mobile inalterada)
- **Editar** colaborador: e-mail de login, nome de exibição e, se existir vínculo, ficha de agenda (nome clínico, CRO, cor `#RRGGBB`, ativo na agenda)
- Recepção convida e reenvia convite **só** para papéis não-admin
- Só o **admin** troca papel, ativa/desativa e convida outro admin
- Editar o próprio e-mail/nome: permitido; auto-troca de papel/ativo: bloqueada

**Não entrega:** exclusão hard, auto-criar ficha de agenda ao promover a dentista, botão “vincular ficha”, fechamento da Fase 7

## Matriz B (resumo)

| Ação                                  | Admin | Recepção |
| ------------------------------------- | ----- | -------- |
| Ver Equipe                            | sim   | sim      |
| Editar dados (alvo não-admin)         | sim   | sim      |
| Editar conta admin                    | sim   | não      |
| Convidar / reenviar não-admin         | sim   | sim      |
| Convidar admin / trocar papel / ativo | sim   | não      |

## Árvore tocada

```text
src/features/team/
├── domain/team-guards.ts (+ .test.ts)
├── schemas.ts (+ schemas.test.ts)
├── actions.ts
├── queries.ts
├── lib/team-action-context.ts
└── components/
    ├── edit-collaborator-dialog.tsx   (novo)
    ├── collaborator-row.tsx
    ├── collaborator-dialog.tsx
    └── collaborator-list.tsx

src/app/(app)/equipe/page.tsx
src/lib/auth/roles.ts
supabase/migrations/029_team_edit_f7.sql
```

## Contas de teste

| Conta                    | Uso nesta fatia                                                 |
| ------------------------ | --------------------------------------------------------------- |
| `admin@clinroma.dev`     | Editar qualquer colaborador; convite admin; desativar           |
| `reception@clinroma.dev` | Editar dentista; convite auxiliar; sem controles de papel/ativo |
| `dentist@clinroma.dev`   | `/equipe` negado                                                |

## Homologação sugerida

1. Recepção edita e-mail de dentista; login com e-mail novo
2. Recepção edita CRO/cor; agenda/Hoje refletem
3. Recepção tenta convidar admin → negado (UI sem opção + servidor)
4. Admin desativa colaborador; recepção não vê o controle
5. Recepção não vê **Editar** na linha de admin

## Comandos

```bash
npm run test -- src/features/team src/lib/auth/roles.test.ts
npm run db:push   # aplica 029_team_edit_f7.sql
```
