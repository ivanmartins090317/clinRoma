# ClinRoma — AGENTS

Sistema clínico odontológico (agenda, prontuário, estoque, fila Kanban).
Piloto: Clínica Neo Roma.

## Repo

- PRD (vault): `segundo-cerebro/10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/prd-mvp.md`
- Segurança: `docs/SECURITY.md`
- Padrão Ivan: Next.js App Router · TypeScript · Supabase · Tailwind · shadcn (adicionar)

## Escopo v1

- Agenda (5 dentistas)
- Prontuário (anamnese isolada, odontograma cruz, evolução + foto + áudio editável, busca, pós-cirurgia WhatsApp)
- Insumos: foto planilha + QR por pacote + scan retirada + e-mail estoque baixo (financeiro)
- Fila Kanban (Vermelho/Amarelo/Verde), 40 min, link paciente LGPD
- Lembrete pós-consulta → dentista (e-mail)

## Fora deste repo

- DeskcommCRM / inbox e bot de WhatsApp (Projeto 1). O ClinRoma **dispara** WhatsApp (Fase 7), não opera conversa.

## Convenções

- UI em pt-BR; schema DB em inglês
- Features em `src/features/<dominio>/`
- Server Components por padrão; `use client` mínimo
- Mobile-first: dentista grava áudio e auxiliar escaneia QR pelo celular
- Nunca travessão "—" em copy

## DoD de documentação (obrigatório ao fechar fase)

Após implementação técnica e evidências (`lint`, `build`, `test`), atualizar:

| Documento                                                             | Conteúdo                                          |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| `docs/implementation/F{N}-*.md`                                       | O que foi entregue (arquivos, migrations, testes) |
| `docs/manual-dev/{NN}-fase-{N}-*.md`                                  | Como funciona, fluxos, contas de teste da fase    |
| `docs/state/PENDENCIAS.md`                                            | Marcar implementado; listar homologação pendente  |
| Índices `docs/implementation/README.md` e `docs/manual-dev/README.md` | Status da fase                                    |

Checklist detalhado: `.cursor/skills/close-phase/SKILL.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
