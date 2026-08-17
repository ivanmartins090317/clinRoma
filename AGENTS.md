# ClinRoma — AGENTS

Sistema clínico odontológico (agenda, prontuário, estoque, fila Kanban).
Piloto: Clínica Neo Roma.

## Repo

- PRD (vault): `segundo-cerebro/10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/prd-mvp.md`
- Segurança: `docs/SECURITY.md`
- Padrão Ivan: Next.js App Router · TypeScript · Supabase · Tailwind · shadcn (adicionar)

## Escopo v1

- Agenda (5 dentistas)
- Prontuário (anamnese, odontograma, evolução + foto + áudio)
- Insumos: foto planilha + QR por pacote + scan retirada
- Fila Kanban (Vermelho/Amarelo/Verde), 40 min, link paciente LGPD
- Lembrete pós-consulta → dentista (e-mail/WhatsApp)

## Fora deste repo

- DeskcommCRM / WhatsApp paciente (Projeto 1)

## Convenções

- UI em pt-BR; schema DB em inglês
- Features em `src/features/<dominio>/`
- Server Components por padrão; `use client` mínimo
- Mobile-first: dentista grava áudio e auxiliar escaneia QR pelo celular
- Nunca travessão "—" em copy
