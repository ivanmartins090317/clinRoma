# Roteiro · Registrar compra / planilha

Arquivo de foto para upload e sugestão:

`docs/fixtures/planilha-compra-teste-clinroma.png`

Formato aceito: JPEG, PNG ou WebP. A foto histórica é só referência. **Sugerir itens da foto** lê a imagem, preenche o assistente e **não** guarda esse arquivo. A entrada (estoque, pacotes, etiquetas) só nasce depois da revisão e de **Confirmar entrada**.

No **celular** (HTTPS), os campos de foto pedem a câmera traseira do sistema (`capture="environment"`). O SO pode oferecer câmera ou galeria. No **desktop**, continua o seletor de arquivo (use a fixture abaixo).

Cobre parte do **TC-30** (entrada + folha de etiquetas) e o caso da fatia de sugestão. O alerta do Anestésico na Hoje já existe no seed (saldo 2, mínimo 5); valide depois em `/hoje`.

Requer `OPENAI_API_KEY` no servidor (opcional `OPENAI_VISION_MODEL=gpt-4o`). Sem chave, use o caminho manual abaixo.

---

## Pré-condição

1. Login: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Desktop, HTTPS
3. Abrir **Estoque** → **Registrar compra**

---

## Passo a passo

### 1. Foto histórica (opcional)

1. Em **1. Foto da planilha (opcional)**, escolha o arquivo  
   `docs/fixtures/planilha-compra-teste-clinroma.png`
2. Espere **Planilha enviada.**
3. **Continuar**

Pule este passo se quiser testar só a sugestão (a foto da sugestão não cria referência histórica).

### 2. Sugerir itens da foto (preferencial)

1. Em **2. Itens**, em **Sugerir itens da foto**, escolha de novo a fixture (pode ser o mesmo arquivo)
2. Acione **Sugerir itens da foto** e espere **Lendo a foto...**
3. Revise as linhas (luva, gaze, anestésico). Corrija o que a leitura errar
4. Para **Gaze** como novo: confira nome, unidade e mínimo
5. Se a leitura falhar: digite à mão (tabela abaixo)

### 2b. Digitar à mão (se não usar sugestão ou se a leitura falhar)

Use **Adicionar linha** para a 2ª e 3ª linhas.

| #   | Tipo             | Insumo                                             | Qtd. por pacote | Pacotes iguais | Lote     | Validade   |
| --- | ---------------- | -------------------------------------------------- | --------------- | -------------- | -------- | ---------- |
| 1   | Insumo existente | Luva nitrílica M                                   | 50              | 1              | L2026-09 | 2027-09-01 |
| 2   | Novo insumo      | Gaze estéril 7,5x7,5 (mínimo 10, unidade unitário) | 100             | 1              | L2026-09 | 2027-12-01 |
| 3   | Insumo existente | Anestésico                                         | 10              | 1              | L2026-09 | 2027-06-01 |

Obs.: no item 2, tipo **Novo insumo**; preencha nome, unidade e mínimo.

### 3. Revisar e confirmar

1. Avance até a revisão (confira a contagem de pacotes e etiquetas)
2. Confirme: devem surgir **3 pacotes** / **3 QR** (do que foi confirmado, não do que a leitura errou)
3. Após confirmar, deve abrir **Imprimir etiquetas** (folha)
4. Clique **Imprimir** (impressora ou Salvar como PDF) e feche

### 4. Conferir resultado

- Em **Estoque**, **Gaze estéril 7,5x7,5** aparece com saldo 100
- Detalhe da Luva: novo pacote ativo lote `L2026-09`, restante 50
- Detalhe do Anestésico: novo pacote + saldo sobe (ex.: 2 → 12)
- Em **Pacotes ativos**: marcar os novos → **Imprimir selecionados** reabre a folha
- Em **Hoje**: se o Anestésico ainda estiver abaixo do mínimo, o alerta continua; se o saldo passou do mínimo, o alerta some
- Se usou só a sugestão (sem passo 1): a foto não deve aparecer como planilha histórica

---

## O que fotografar / mandar no chat

1. Modal com linhas sugeridas (ou **Planilha enviada.** se testou histórico)
2. Folha **Imprimir etiquetas** com os 3 QR
3. Lista de estoque com Gaze e saldos atualizados
4. (Opcional) `/hoje` com seção de estoque abaixo do mínimo

Status sugerido: `TC-30 ok` + prints · fatia sugestão ok.

---

## Homologação celular (câmera nativa)

HTTPS em iPhone e Android reais:

1. Passo 2: acionar o campo abre a câmera traseira ou a escolha câmera/galeria
2. Foto tirada na hora entra na sugestão só depois de **Sugerir itens da foto**
3. Negar permissão de câmera: ainda dá para escolher da galeria ou digitar
4. Desktop: fixture por arquivo, como no roteiro acima
5. Passo 1 (admin): fotografar continua só referência histórica
