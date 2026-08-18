# Fase 5 · Insumos e estoque

| Campo      | Valor                                            |
| ---------- | ------------------------------------------------ |
| **Status** | concluída (código) · homologação manual pendente |
| **Plano**  | `docs/PLANO.md` §6 · Fase 5                      |
| **Spec**   | `specs/2026-08-18-fase-5-insumos-estoque.md`     |

## Objetivo

Controle operacional de insumos: cadastro, entrada via planilha (foto + digitação manual), QR por pacote, retirada por scan mobile, alertas na Hoje e PWA com atalho para scan.

## Entregue

### Banco de dados (migrations)

| Arquivo                  | Conteúdo                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `016_stock_f5.sql`       | `remaining_quantity`, trigger `apply_supply_movement`, checks |
| `017_seed_stock_dev.sql` | 5 insumos, 3 pacotes QR demo, anestésico abaixo do mínimo     |

### Feature `src/features/stock/`

| Área       | Arquivos                                                           |
| ---------- | ------------------------------------------------------------------ |
| Domínio    | saldo, situação insumo/pacote, QR, retirada + testes Vitest        |
| Dados      | `queries.ts` (lista, detalhe, alertas Hoje, lookup QR)             |
| Escrita    | `actions.ts`, `schemas.ts`                                         |
| Server lib | `apply-withdrawal.ts`, `apply-stock-entry.ts`, `clinic-date.ts`    |
| UI         | lista, detalhe, wizard compra, etiquetas, scan contínuo, leitor QR |

### Páginas e integrações

- `/estoque` · lista com busca, detalhe, cadastro admin, wizard compra
- `/estoque/scan` · fluxo mobile scan + confirmação + modo contínuo
- `/hoje` · seção **Estoque · abaixo do mínimo**
- PWA · `src/app/manifest.ts`, ícones `public/icons/`, atalho Scan estoque

### Dependências adicionadas

`qrcode`, `zxing-wasm`, `@types/qrcode`

### Testes automatizados

- `stock/domain/supply-status.test.ts`
- `stock/domain/package-status.test.ts`
- `stock/domain/qr-code.test.ts`
- `stock/domain/stock-balance.test.ts`
- `stock/domain/withdrawal.test.ts`

## Evidências de Done

| Comando                | Resultado                                            |
| ---------------------- | ---------------------------------------------------- |
| `npm run db:push`      | Migrations 016 e 017 aplicadas                       |
| `npm run db:types`     | Tipos atualizados manualmente em `database.types.ts` |
| `npm run lint`         | OK (0 erros)                                         |
| `npm run format:check` | Arquivos F5 formatados; legado F0–F4 com warn        |
| `npm run build`        | OK                                                   |
| `npm run test`         | OK · 98 passed, 15 skipped                           |

## Homologação manual pendente

Obrigatória em **iPhone e Android reais** antes do fechamento operacional:

- Scan `CR-DEV001` → retirada → saldo atualizado (§8.3 spec)
- Modo contínuo com 3 pacotes distintos
- Admin: cadastro, etiquetas, alerta na Hoje

Ver `docs/manual-dev/07-fase-5-insumos-estoque.md` e `docs/state/PENDENCIAS.md`.
