# Editar e apagar insumo

Fatia sobre a Fase 5 (estoque). Plano: `docs/plans/plano-edicao-exclusao-insumo.md`.
Roteiro: `docs/fixtures/ROTEIRO-editar-deletar-insumo.md`.

## O que entrega

- **Editar insumo** no detalhe, com o formulário de cadastro: nome, unidade, mínimo e saldo
- Saldo alterado vira movimentação `adjustment`, observação "Correção pelo cadastro do insumo"
- Mínimo **0** tira o item da reposição sem apagar
- **Deletar insumo** (só admin) com confirmação de perda de histórico, pacotes e alertas
- Migration `030_supply_delete_cascade.sql`: `supply_movements` em cascata e `DELETE` só para admin

## O que não entrega

- Arquivar insumo mantendo o histórico
- Converter quantidade ao trocar a unidade
- Atualizar o restante das etiquetas quando o saldo do cadastro muda
- Exclusão do insumo pela auxiliar (ela continua podendo deletar pacote)

## Pastas

```text
src/features/stock/domain/supply-balance-edit.ts
src/features/stock/components/stock-supply-form.tsx
src/features/stock/components/stock-supply-editor-dialog.tsx
src/features/stock/components/stock-supply-delete-dialog.tsx
src/features/stock/components/stock-supply-detail.tsx
src/features/stock/actions.ts · schemas.ts
supabase/migrations/030_supply_delete_cascade.sql
```

## Fluxo

1. Admin abre `/estoque` e o insumo
2. **Editar insumo** altera mínimo para 0, ou o saldo
3. Um único sync do alerta financeiro compara o estado anterior com o final
4. **Deletar** só depois da confirmação; a lista volta sem o item

Se o campo de saldo não mudou, nenhuma movimentação é criada.

## Contas de teste

Senha de dev: `ClinRomaDev2026!`

| Papel    | E-mail                   | Neste ajuste                          |
| -------- | ------------------------ | ------------------------------------- |
| Admin    | `admin@clinroma.dev`     | Editar e deletar insumo               |
| Auxiliar | `assistant@clinroma.dev` | Sem os dois botões; deletar pacote ok |

## Comandos

```bash
npm run db:push
npm run test
```
