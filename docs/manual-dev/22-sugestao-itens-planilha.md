# Sugestão de itens da foto da planilha

Fatia sobre a Fase 5 (estoque). Spec: `specs/2026-09-23-sugestao-itens-planilha-vision.md`.
Registro: `docs/implementation/F5-sugestao-planilha-vision.md`.

## O que entrega

- Botão **Sugerir itens da foto** no assistente **Registrar compra**
- Leitura no servidor com a mesma `OPENAI_API_KEY` do Whisper; modelo em `OPENAI_VISION_MODEL` (default `gpt-4o`)
- Preenchimento do assistente com confiança alta (insumo pré-selecionado) ou baixa (novo)
- Confirmação humana obrigatória; rastro em `audit_log` só com contagens e modelo
- No celular, a origem da foto pode ser a câmera traseira nativa (`capture="environment"`); no desktop segue o seletor de arquivo

## O que não entrega

- Gravar estoque só com a leitura
- Guardar a foto usada na sugestão
- Fechar de novo a Fase 5
- Trocar a transcrição de áudio

## Pastas

```text
src/lib/stock/extract-purchase-sheet.ts
src/features/stock/domain/supply-name-match.ts
src/features/stock/components/suggest-purchase-items.tsx
src/features/stock/components/stock-purchase-wizard.tsx  (liga a sugestão)
src/features/stock/actions.ts · schemas.ts
```

## Fluxo feliz

1. Admin ou auxiliar abre Estoque → Registrar compra
2. (Opcional) anexa foto histórica no passo 1 (referência; admin)
3. No passo 2, fotografe a nota no celular (ou escolha o arquivo) e acione **Sugerir itens da foto**
4. Revê linhas, remove ou edita; auxiliar troca “novo” por existente
5. Revisão mostra pacotes e etiquetas → **Confirmar entrada**
6. Folha de etiquetas como hoje

## Contas de teste

| Papel    | Conta                                        | O que validar                   |
| -------- | -------------------------------------------- | ------------------------------- |
| Admin    | `admin@clinroma.dev`                         | Sugestão + novo insumo + rastro |
| Auxiliar | `auxiliar@clinroma.dev` (ou seed do projeto) | Sugestão; não cadastra novo     |
| Recepção | `recepcao@clinroma.dev`                      | Sem Registrar compra / sugestão |

Fixture: `docs/fixtures/planilha-compra-teste-clinroma.png` · roteiro `docs/fixtures/ROTEIRO-registrar-compra.md`.

## Ambiente

```env
OPENAI_API_KEY=...
# opcional
OPENAI_VISION_MODEL=gpt-4o
```

Sem chave: a sugestão falha com mensagem para digitar manualmente; a compra manual segue.

## Comandos

```bash
npm run test -- src/features/stock/domain/supply-name-match.test.ts src/lib/stock/extract-purchase-sheet.test.ts
npm run lint
npm run build
```
