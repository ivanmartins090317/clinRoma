# Plano · Sugestão de itens a partir da foto da planilha (Vision)

> Status: **rascunho · aguardando aprovação do Felipe Roma**
> Origem: research pós-homologação F5 (fluxo atual = foto + digitação manual, sem OCR)
> Pré-requisito: estoque F5 estável; chave OpenAI já usada pelo Whisper
> Autonomia sugerida após aprovação: **medium** (spec + implementação em fatia própria)

**Não implementar até o Felipe aprovar.** Este plano é só para levar a ideia à clínica.

---

## Objetivo

Na **Registrar compra**, após enviar a foto da nota/planilha, um botão **Sugerir itens da foto** pré-preenche as linhas do wizard. O admin **revisa e confirma**. Só então o sistema cria insumos/pacotes/QR (fluxo atual de entrada).

Valor: menos digitação; a foto continua sendo histórico; **nunca** grava estoque só com IA.

---

## 1. Abordagem (5 passos)

1. **Extrair (servidor)**  
   Enviar a imagem já no Storage (`supply-sheets`) a um modelo **vision** da OpenAI (ex.: `gpt-4o`), com prompt estrito pedindo JSON tipado: nome, quantidade por pacote, n° de pacotes, lote, validade, unidade sugerida. Sem gravação de estoque nesta etapa.

2. **Mapear ao catálogo**  
   Para cada linha: fuzzy match com `supplies` existentes. Alta confiança → pré-seleciona insumo; baixa → marca como **novo**. Admin vê confiança e pode trocar.

3. **Revisar (obrigatório)**  
   Preencher o wizard atual com as sugestões. Admin edita, remove ou adiciona linhas. Botão **Confirmar compra** só depois da revisão (igual hoje).

4. **Gerar pacotes e QR**  
   Reutilizar `registerPurchaseAction` / folha de etiquetas. 1 embalagem física = 1 pacote = 1 QR. Sem mudar a regra operacional.

5. **Auditar e medir**  
   Registrar no audit (ou tabela leve): quem confirmou, quantas linhas vieram da IA vs editadas, modelo usado. Homologação manual com a fixture `docs/fixtures/planilha-compra-teste-clinroma.png`.

---

## 2. Arquivos que devem ser criados / alterados

### Criar (provável)

| Arquivo | Função |
| ------- | ------ |
| `specs/YYYY-MM-DD-sugestao-itens-planilha-vision.md` | Spec fechada pós-aprovação Felipe |
| `src/lib/stock/extract-purchase-sheet.ts` (ou similar) | Chamada vision + parse/validação Zod do JSON |
| `src/features/stock/domain/supply-name-match.ts` (+ teste) | Match fuzzy nome sugerido ↔ catálogo |
| `src/app/api/stock/suggest-purchase-items/route.ts` (ou action) | Endpoint/action autenticada admin/auxiliar |
| `docs/implementation/F?-sugestao-planilha-vision.md` | Registro ao fechar |
| `docs/manual-dev/` + trecho em `docs/manual-usuario/` | Como usar “Sugerir itens” |

### Alterar (provável)

| Arquivo | Função |
| ------- | ------ |
| `src/features/stock/components/stock-purchase-wizard.tsx` | Botão sugerir; preencher linhas; estados loading/erro |
| `src/features/stock/actions.ts` / `schemas.ts` | Action + schema da sugestão (sem persistir compra) |
| `.env.example` / docs de env | Documentar modelo vision (reusa `OPENAI_API_KEY`) |
| `docs/state/PENDENCIAS.md` | Item vivo após aprovação |
| `docs/relatorio-testes-manuais.html` | TC novo em FL-05 (opcional na mesma fatia) |

Migrations: só se houver tabela de log de sugestões; senão audit_log basta.

---

## 3. Fora de escopo

- OCR/vision **sem** revisão humana (proibido em `docs/SECURITY.md`)
- Gravação automática de estoque ou QR só com a foto
- Trocar Whisper / mexer em transcrição de áudio
- Treinar modelo próprio ou Document AI de terceiro (MVP = OpenAI vision)
- Leitura de XML/NFe, integração com fornecedor ou ERP
- OCR de qualquer outro documento (receita, prontuário, RG)
- App nativo ou fila offline para a sugestão

---

## 4. Riscos técnicos

| Risco | Mitigação |
| ----- | --------- |
| Alucinação / linha inventada | Confirmação humana obrigatória; nunca chamar `registerPurchase` na extração |
| Nome da nota ≠ nome do cadastro | Match + UI “existente / novo”; admin corrige |
| Custo e latência OpenAI | Só sob demanda (botão); timeout; limitar tamanho da imagem (já há teto no upload) |
| Layout de nota muito diferente | Mensagem “não consegui ler; digite manual”; fallback = fluxo atual |
| Vazamento de prompt / dados | Só envia imagem de compra; sem paciente; server-only; chave só no server |
| Confusão operacional (gerar QR demais) | Manter regra 1 embalagem = 1 etiqueta; copy clara na revisão |

---

## 5. Path crítico?

**Sim**, parcialmente.

| Path | Toca? | Nota |
| ---- | ----- | ---- |
| Entrada de estoque / saldo / pacotes / QR | **Sim** (indireto) | Só depois da confirmação humana; a geração reutiliza o path atual |
| Upload `supply-sheets` | **Sim** | Pré-requisito da sugestão |
| Scan QR / retirada | Não | |
| Agenda / prontuário / Whisper | Não | |
| Auth / RLS papéis estoque | **Sim** (borda) | Mesma matriz: quem já pode registrar compra |

Path crítico de **escrita de saldo** não muda de regra: continua só no confirm atual. O novo trecho crítico é **confiar demais na IA** se a revisão for fraca ou bypassada.

---

## Decisão pedida ao Felipe

1. Vale a pena no piloto (custo OpenAI + risco de erro de leitura)?  
2. Quem usa: só admin, ou auxiliar também (como na entrada hoje)?  
3. MVP só “sugerir e revisar”, sem auto-criar insumo novo sem olhar?

**Pronto para código quando:** Felipe aprovar por escrito (ou no chat) + spec criada + este plano marcado como aprovado.

---

## Próximo passo (após aprovação)

1. Fechar spec em `specs/`.  
2. Branch `feature/sugestao-itens-planilha-vision`.  
3. Implementar fatia MVP (passos 1–4) + testes de match + homologação com a fixture.  
4. Atualizar `docs/implementation`, `docs/manual-dev`, `PENDENCIAS`.
