# Fatia · Captura da nota pela câmera do celular

| Campo      | Valor                                                |
| ---------- | ---------------------------------------------------- |
| **Status** | concluída (código) · homologação celular pendente    |
| **Plano**  | conversa pós-fatia de sugestão (sem plano separado)  |
| **Spec**   | `specs/2026-09-23-captura-camera-planilha.md`        |
| **Fase**   | Fatia de UX sobre estoque. **Não** reabre nem fecha a Fase 5. |

## Objetivo

Nos dois campos de foto de **Registrar compra**, no celular, permitir fotografar a nota com a câmera traseira do sistema via `capture="environment"`. Sem viewfinder no ClinRoma. Desktop continua escolhendo arquivo.

## Entregue

| Área     | Arquivos                                                                 |
| -------- | ------------------------------------------------------------------------ |
| Domínio  | `src/features/stock/domain/purchase-photo-capture.ts` (+ testes)         |
| UI       | `suggest-purchase-items.tsx` · `stock-purchase-wizard.tsx` (passo 1)     |
| Manuais  | `docs/manual-usuario/*` · `docs/fixtures/ROTEIRO-registrar-compra.md`    |
| Dev      | frase em `docs/manual-dev/22-sugestao-itens-planilha.md`                 |

## Regras cobertas

- `accept` JPEG/PNG/WebP; `capture="environment"`
- Sugestão só no botão; foto da sugestão sem Storage
- Copy pt-BR sem travessão: no celular dá para fotografar agora
- Sem `getUserMedia`, sem nova action, sem migration

## Testes automatizados

- `purchase-photo-capture.test.ts` (atributos do input)

## Homologação manual pendente

iPhone e Android reais, HTTPS (roteiro atualizado):

- Passo 2: câmera traseira ou escolha câmera/galeria
- Foto na hora só dispara leitura no botão
- Negar permissão: galeria ou digitação
- Desktop: fixture por arquivo
- Passo 1 (admin): foto só referência histórica

## Evidências de Done

| Comando | Resultado |
| ------- | --------- |
| `npx eslint` (arquivos da fatia) | OK (0 erros) |
| `npm run lint` (repo inteiro) | Falha pré-existente fora do escopo (scanner / stock-list / waitlist / env.test) |
| `npm run build` | OK |
| `npm run test` | OK · 58 arquivos · 433 passed · 3 testes novos desta fatia |
