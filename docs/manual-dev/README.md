# Manual do desenvolvedor · ClinRoma

Guia de arquitetura, fases implementadas e operação do ambiente de desenvolvimento.

**Piloto:** Clínica Neo Roma · **Stack:** Next.js 16 · React 19 · Supabase · Tailwind 4 · shadcn/ui

---

## Índice

| Documento                                                                      | Conteúdo                                           |
| ------------------------------------------------------------------------------ | -------------------------------------------------- |
| [01-arquitetura.md](./01-arquitetura.md)                                       | Visão geral, pastas, fluxos, padrões de código     |
| [02-fase-0-fundacao.md](./02-fase-0-fundacao.md)                               | Fase 0: shell, HTTPS, shadcn, middleware base      |
| [03-fase-1-dados-auth-papeis.md](./03-fase-1-dados-auth-papeis.md)             | Fase 1: banco, auth, papéis, **contas de teste**   |
| [06-fase-4-fila-kanban.md](./06-fase-4-fila-kanban.md)                         | Fase 4: fila Kanban, link paciente, cron           |
| [07-fase-5-insumos-estoque.md](./07-fase-5-insumos-estoque.md)                 | Fase 5: estoque, QR, scan mobile, PWA              |
| [08-fase-6-lembrete-piloto.md](./08-fase-6-lembrete-piloto.md)                 | Fase 6: lembrete e-mail, cron, deploy, homologação |
| [09-fase-7-01-transcricao-editavel.md](./09-fase-7-01-transcricao-editavel.md) | Fase 7 fatia F7-01: transcrição editável           |
| [10-fase-7-07-segundo-telefone.md](./10-fase-7-07-segundo-telefone.md)         | Fase 7 fatia F7-07: segundo telefone no cadastro   |
| [11-fase-7-09-card-paciente.md](./11-fase-7-09-card-paciente.md)               | Fase 7 fatia F7-09: card do paciente               |

## Documentos relacionados

| Onde                                                  | Para quê                                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| [`docs/manual-usuario/`](../manual-usuario/README.md) | Manual para a equipe da clínica (não técnico)  |
| [`docs/PLANO.md`](../PLANO.md)                        | Roadmap completo (Fases 0–7)                   |
| [`docs/implementation/`](../implementation/)          | Registro objetivo do que foi entregue por fase |
| [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)  | O que falta implementar ou validar             |
| [`docs/SECURITY.md`](../SECURITY.md)                  | Checklist de segurança por feature             |
| [`README.md`](../../README.md)                        | Setup rápido (clone, env, scripts)             |

## Fases do projeto

| Fase                       | Status                  | Manual                                                                                                                                                  |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 · Fundação               | concluída               | [02-fase-0-fundacao.md](./02-fase-0-fundacao.md)                                                                                                        |
| 1 · Dados, auth e papéis   | concluída               | [03-fase-1-dados-auth-papeis.md](./03-fase-1-dados-auth-papeis.md)                                                                                      |
| 2 · Agenda                 | concluída (código)      | [04-fase-2-agenda.md](./04-fase-2-agenda.md)                                                                                                            |
| 3 · Pacientes e prontuário | concluída (código)      | [05-fase-3-pacientes-prontuario.md](./05-fase-3-pacientes-prontuario.md)                                                                                |
| 4 · Fila Kanban            | concluída (código)      | [06-fase-4-fila-kanban.md](./06-fase-4-fila-kanban.md)                                                                                                  |
| 5 · Insumos e estoque      | concluída (código)      | [07-fase-5-insumos-estoque.md](./07-fase-5-insumos-estoque.md)                                                                                          |
| 6 · Lembrete e piloto      | concluída (código)      | [08-fase-6-lembrete-piloto.md](./08-fase-6-lembrete-piloto.md)                                                                                          |
| 7 · Ajustes demo Felipe    | F7-01, F7-07 e F7-09 em código | [09-fase-7-01-transcricao-editavel.md](./09-fase-7-01-transcricao-editavel.md) · [10-fase-7-07-segundo-telefone.md](./10-fase-7-07-segundo-telefone.md) · [11-fase-7-09-card-paciente.md](./11-fase-7-09-card-paciente.md) |

## Comandos do dia a dia

```bash
npm run dev              # HTTPS local (https://localhost:3000)
npm run db:push          # aplicar migrations no Supabase de dev
npm run db:push:dry      # preview do delta
npm run db:types         # regenerar database.types.ts (requer Docker)
npm run test             # Vitest
npm run lint             # ESLint
npm run build            # build de produção
```

## Regra de manutenção

Ao **fechar cada fase**:

1. Adicionar capítulo em `docs/manual-dev/` (este manual)
2. Registrar entregáveis em `docs/implementation/`
3. Atualizar pendências em `docs/state/PENDENCIAS.md`
