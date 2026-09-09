# Roteiro · Registrar compra / planilha

Arquivo de foto para upload:

`docs/fixtures/planilha-compra-teste-clinroma.png`

Formato aceito: JPEG, PNG ou WebP. Sem OCR: a foto é só referência; você digita as linhas.

Cobre parte do **TC-30** (entrada + folha de etiquetas). O alerta do Anestésico na Hoje já existe no seed (saldo 2, mínimo 5); valide depois em `/hoje`.

---

## Pré-condição

1. Login: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Desktop, HTTPS
3. Abrir **Estoque** → **Registrar compra**

---

## Passo a passo

### 1. Foto da planilha

1. Em **1. Foto da planilha (opcional)**, escolha o arquivo  
   `docs/fixtures/planilha-compra-teste-clinroma.png`
2. Espere **Planilha enviada.**
3. **Continuar**

### 2. Digitar os 3 itens (como na foto)

Use **Adicionar item** para a 2ª e 3ª linhas.

| # | Tipo | Insumo | Qtd. por pacote | Pacotes iguais | Lote | Validade |
| - | ---- | ------ | --------------- | -------------- | ---- | -------- |
| 1 | Insumo existente | Luva nitrílica M | 50 | 1 | L2026-09 | 2027-09-01 |
| 2 | Novo insumo | Gaze estéril 7,5x7,5 (mínimo 10, unidade unitário) | 100 | 1 | L2026-09 | 2027-12-01 |
| 3 | Insumo existente | Anestésico | 10 | 1 | L2026-09 | 2027-06-01 |

Obs.: no item 2, tipo **Novo insumo**; preencha nome, unidade e mínimo.

### 3. Revisar e confirmar

1. Avance até a revisão
2. Confirme: devem surgir **3 pacotes** / **3 QR**
3. Após confirmar, deve abrir **Imprimir etiquetas** (folha)
4. Clique **Imprimir** (impressora ou Salvar como PDF) e feche

### 4. Conferir resultado

- Em **Estoque**, **Gaze estéril 7,5x7,5** aparece com saldo 100
- Detalhe da Luva: novo pacote ativo lote `L2026-09`, restante 50
- Detalhe do Anestésico: novo pacote + saldo sobe (ex.: 2 → 12)
- Em **Pacotes ativos**: marcar os novos → **Imprimir selecionados** reabre a folha
- Em **Hoje**: se o Anestésico ainda estiver abaixo do mínimo, o alerta continua; se o saldo passou do mínimo, o alerta some

---

## O que fotografar / mandar no chat

1. Modal com **Planilha enviada.**
2. Folha **Imprimir etiquetas** com os 3 QR
3. Lista de estoque com Gaze e saldos atualizados
4. (Opcional) `/hoje` com seção de estoque abaixo do mínimo

Status sugerido: `TC-30 ok` + prints.
