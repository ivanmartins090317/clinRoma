# Fatia · Sugestão de itens da foto da planilha

| Campo      | Valor                                                  |
| ---------- | ------------------------------------------------------ |
| **Status** | concluída (código) · homologação manual pendente       |
| **Plano**  | `docs/plans/plano-sugestao-itens-planilha-vision.md`   |
| **Spec**   | `specs/2026-09-23-sugestao-itens-planilha-vision.md`   |
| **Fase**   | Fatia sobre a Fase 5. **Não** reabre nem fecha a fase. |

## Objetivo

Em **Registrar compra**, botão **Sugerir itens da foto**: o servidor lê a imagem (mesma chave OpenAI da transcrição), devolve linhas para o assistente e **descarta** o arquivo. Estoque, pacote e etiqueta só nascem em **Confirmar entrada**.

## Entregue

| Área              | Arquivos                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| Leitura (server)  | `src/lib/stock/extract-purchase-sheet.ts` (+ testes de validação)           |
| Domínio           | `src/features/stock/domain/supply-name-match.ts` (+ testes)                 |
| UI                | `src/features/stock/components/suggest-purchase-items.tsx` · wizard ligado  |
| Actions / schemas | `suggestPurchaseItemsAction` · rastro opcional na confirmação (`audit_log`) |
| Ambiente          | `.env.example` · `OPENAI_VISION_MODEL` (reusa `OPENAI_API_KEY`)             |

## Regras cobertas

- JPEG/PNG/WebP até 10 MB; teto de 40 linhas sugeridas
- Aproximação de nome: igualdade, candidato claro, empate, ausência
- Auxiliar sugere e confirma só insumo existente; admin pode aceitar novo
- Foto da sugestão não vai ao Storage nem ao rastro
- Compra sem sugestão permanece sem contadores de leitura

## Testes automatizados

- `supply-name-match.test.ts`
- `extract-purchase-sheet.test.ts` (arquivo inválido, campos inválidos, teto 40, papel auxiliar sem write)

## Homologação manual pendente

Com a fixture `docs/fixtures/planilha-compra-teste-clinroma.png` (roteiro atualizado):

- Pedir sugestão, revisar e confirmar
- Foto só da sugestão não aparece como planilha histórica
- Papel sem permissão não sugere
- Celular: botão e espera visíveis

## Evidências de Done

| Comando | Resultado |
| ------- | --------- |
| `npx eslint` (arquivos da fatia) | OK (0 erros) |
| `npm run lint` (repo inteiro) | Falha pré-existente fora do escopo (scanner/stock-list/waitlist/env.test) |
| `npm run format:check` | Warn legado no repo; arquivos da fatia formatados com Prettier |
| `npm run build` | OK |
| `npm run test` | OK · suite completa + 15 testes novos da fatia |
