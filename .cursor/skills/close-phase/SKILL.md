---
name: close-phase
description: >-
  Checklist para fechar uma fase ou spec: atualizar docs/implementation,
  docs/manual-dev e docs/state/PENDENCIAS.md após implementação técnica.
  Use ao concluir feature, fechar fase, "finalize a implementação" ou antes
  de marcar spec como pronta.
---

# Fechamento de fase · ClinRoma

Piloto: **Clínica Neo Roma**. Sempre responder e documentar em **pt-BR**.

## Quando usar

- Spec aprovada implementada (código + testes passando)
- Usuário pede "feche a fase", "finalize a implementação" ou equivalente
- **Antes** de reportar a entrega como concluída ao mantenedor

## Pré-requisito técnico

Rodar e registrar evidências:

```bash
npm run lint
npm run build
npm run test
npm run db:push        # se houver migration nova
npm run db:types       # se schema mudou (requer Docker)
```

## Checklist de documentação (obrigatório)

### 1. `docs/implementation/F{N}-*.md`

Criar ou atualizar registro **objetivo** da fase. Modelo: `docs/implementation/F1-dados-auth-papeis.md`.

Incluir:

- Status, plano (`docs/PLANO.md` §N), spec (`specs/...`)
- Tabelas de arquivos entregues (migrations, features, páginas)
- Testes automatizados adicionados
- Evidências de Done (comando + resultado)
- Pendências menores (homologação manual, dívida técnica)

Atualizar **`docs/implementation/README.md`**: linha da fase → link + status `concluída`.

### 2. `docs/manual-dev/{NN}-fase-{N}-*.md`

Criar capítulo **explicativo** para o dev. Modelo: `docs/manual-dev/03-fase-1-dados-auth-papeis.md`.

Incluir:

- O que a fase entrega (e o que **não** entrega)
- Árvore de pastas da feature
- Fluxos principais (happy path)
- Contas de teste e cenários de homologação manual
- Comandos úteis
- Link para `docs/implementation/F{N}-*.md` e próxima fase em `PENDENCIAS.md`

Atualizar **`docs/manual-dev/README.md`**: índice + tabela de fases.

### 3. `docs/state/PENDENCIAS.md`

- Marcar com `[x]` itens **implementados** da fase
- Mover itens de **homologação manual** para subseção "Fechamento operacional" se ainda não validados
- Atualizar "Última revisão" com data
- Não apagar fases futuras; só atualizar estado

## Ordem recomendada

1. Evidências técnicas (lint, build, test, db:push)
2. `docs/implementation/F{N}-*.md` + README
3. `docs/manual-dev/{NN}-fase-{N}-*.md` + README
4. `docs/state/PENDENCIAS.md`
5. Reportar ao usuário com links para os três docs

## O que não fazer

- Não alterar a spec (`specs/`) salvo pedido explícito
- Não marcar homologação `manual-report` como feita (Fase 6)
- Não sobrescrever `.env.local`

## Referências

- Regra always-on: `.cursor/rules/project-general.mdc`
- Contrato do repo: `AGENTS.md` § DoD de documentação
- Homologação formal (Fase 6): `.cursor/skills/manual-report/SKILL.md`
