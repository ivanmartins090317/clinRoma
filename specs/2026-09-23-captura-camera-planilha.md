# Spec · Captura da nota pela câmera do celular

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-09-23                                                            |
| **Slug**         | captura-camera-planilha                                               |
| **Plano origem** | conversa pós-fatia de sugestão (sem plano separado)                  |
| **Fase**         | Fatia de UX sobre estoque / sugestão. **Não** reabre nem fecha fase. |
| **Autonomia**    | tight                                                                 |
| **Pré-requisito**| `specs/2026-09-23-sugestao-itens-planilha-vision.md` no código        |

---

## 1. Contexto

Em **Registrar compra** a pessoa escolhe um arquivo nos dois usos da foto:

1. Foto histórica (passo 1, opcional): guarda referência.
2. **Sugerir itens da foto** (passo 2): lê e descarta o arquivo.

Hoje o campo é só “Escolher arquivo”. No celular da auxiliar isso abre a galeria. A clínica quer fotografar a nota na hora, sem passar por um app de câmera separado e sem viewfinder dentro do ClinRoma.

O navegador já faz isso com o atributo nativo `capture="environment"` no `input type="file"`. A câmera traseira do sistema abre; a foto volta como arquivo JPEG/PNG/WebP e segue o fluxo que já existe.

---

## 2. Objetivo

1. Nos dois campos de foto do assistente, no celular, a pessoa consegue **tirar a foto agora** com a câmera traseira.
2. A galeria continua disponível quando o sistema operacional oferecer essa escolha.
3. No computador, o campo continua sendo escolha de arquivo (o atributo de captura é ignorado).
4. Depois da foto, nada muda: histórico guarda; sugestão lê e descarta; estoque só na confirmação.

**Valor entregue:** fotografar a nota no celular sem construir câmera própria.

---

## 3. Atores

Os mesmos de quem já registra compra.

| Ator | Interesse |
| ---- | --------- |
| Administrador | Fotografar ou escolher arquivo na referência histórica e na sugestão |
| Auxiliar de sala | Fotografar ou escolher arquivo na sugestão. Foto histórica continua só para quem o servidor já autoriza (admin) |
| Recepção, dentista, visualizador | Sem registrar compra. Sem estes campos |
| Paciente | Fora |

---

## 4. Modelo de domínio

### 4.1 O que muda

Só a origem do arquivo no navegador.

| Campo | Onde | Depois da foto |
| ----- | ---- | -------------- |
| Foto da planilha (opcional) | Passo 1 do assistente | Mesmo upload histórico de hoje |
| Foto da nota ou planilha | **Sugerir itens da foto** | Mesma leitura de hoje. Arquivo não é guardado |

Formatos, teto de 10 MB, papéis, revisão e rastro **não** mudam.

### 4.2 O que a câmera faz

- `accept` permanece `image/jpeg,image/png,image/webp`.
- `capture="environment"` pede a câmera **traseira**.
- Não há preview contínuo, lanterna, recorte nem segundo botão “Abrir câmera” dentro do app.
- Permissão de câmera é a do sistema, no momento em que a pessoa aciona o campo.
- Se a pessoa negar a câmera, o campo de arquivo continua utilizável (galeria ou arquivo local).
- Desktop: seletor de arquivo, como hoje.

Comportamento exato (abre direto a câmera ou mostra “câmera ou galeria”) depende do navegador. A fatia não tenta unificar isso com código próprio.

### 4.3 Custo

Uma foto, uma ação já existente. Sem chamada extra ao modelo de leitura. Sem Storage novo.

---

## 5. Matriz de acesso

Igual à compra e à sugestão. Quem não registra compra não vê o assistente. Quem não envia planilha histórica continua sem esse upload no servidor.

---

## 6. Escopo funcional

### 6.1 Campos

- Passo 1: o input de foto histórica ganha `capture="environment"`.
- Passo 2: o input de **Sugerir itens da foto** ganha o mesmo atributo.
- Alvo de toque e texto em 16px permanecem (mobile-first).
- Copy curta, pt-BR, sem travessão: deixa claro que no celular dá para fotografar a nota agora.

### 6.2 O que não muda

- Sugestão só no botão **Sugerir itens da foto**. Escolher ou fotografar não dispara a leitura sozinha.
- Foto da sugestão não vai a Storage, `supply_sheets` nem rastro.
- Foto histórica só existe se a pessoa usar o passo 1 e o servidor aceitar.
- Falha de leitura: **Não consegui ler a foto. Digite os itens manualmente.**
- Limite de body das Server Actions permanece o já ajustado para arquivo de até 10 MB.

### 6.3 Homologação sugerida

Celular real (iPhone e Android), HTTPS:

- No passo 2, acionar o campo abre câmera traseira ou a escolha câmera/galeria.
- Foto tirada na hora entra na sugestão depois do botão.
- Negar permissão não trava o assistente: ainda dá para escolher da galeria ou digitar.
- Desktop: escolher arquivo da fixture continua igual.
- Passo 1 (admin): fotografar ainda é referência histórica, não preenchimento de linhas.

---

## 7. Fora de escopo

- Viewfinder dentro do ClinRoma (`getUserMedia`, vídeo ao vivo, botão disparar no app).
- Leitura contínua enquanto a câmera está aberta.
- Lanterna, zoom ou recorte da nota.
- Trocar o serviço de leitura, o teto de 40 linhas ou a regra de uma embalagem por etiqueta.
- Nova permissão no servidor. A câmera é só do navegador.
- Aplicativo nativo.
- Fechar a Fase 5 ou a fatia de sugestão de novo.

---

## 8. Caminhos felizes

### 8.1 Auxiliar fotografa e sugere

1. Abre **Registrar compra** no celular.
2. Pula a foto histórica (ou o admin já guardou à parte).
3. Em **Sugerir itens da foto**, aciona o campo e fotografa a nota com a câmera traseira.
4. Aciona **Sugerir itens da foto**, revisa e confirma como hoje.

### 8.2 Admin guarda referência fotografando

1. No passo 1, fotografa a planilha.
2. A foto histórica é guardada como hoje.
3. A sugestão, se quiser, é um segundo uso (pode fotografar de novo ou escolher a mesma imagem).

### 8.3 Desktop

1. Os dois campos abrem o seletor de arquivo.
2. Fixture e digitação manual seguem iguais.

---

## 9. Erros e bordas

| Situação | Comportamento |
| -------- | ------------- |
| Permissão de câmera negada | Campo de arquivo continua. Mensagem só se o navegador não devolver arquivo |
| Foto acima de 10 MB ou formato inválido | Recusa já existente, antes da leitura ou do upload |
| Navegador sem `capture` | Cai no seletor de arquivo |
| Foto borrada ou escura | A leitura pode falhar; digitação manual permanece |
| Segundo toque enquanto lê | Botão de sugestão continua bloqueado, como hoje |

---

## 10. Critérios de Done

- [ ] Os dois inputs de foto do assistente usam `capture="environment"`.
- [ ] Desktop continua escolhendo arquivo.
- [ ] Sugestão não dispara ao fotografar; só no botão.
- [ ] Foto da sugestão continua sem Storage e sem rastro de imagem.
- [ ] Copy pt-BR, sem travessão.
- [ ] Nenhum arquivo fora do §11.
- [ ] `npm run lint` nos arquivos tocados, `npm run build` e `npm run test` passam.
- [ ] Homologação em celular listada em `docs/state/PENDENCIAS.md` se ainda não for feita nesta fatia.
- [ ] Sem viewfinder próprio.

Não exigido: teste automatizado de câmera (API do navegador). Sem chamada real ao modelo só por causa deste atributo.

---

## 11. Escopo de arquivos permitidos

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/stock/components/suggest-purchase-items.tsx` | `capture="environment"` e copy |
| `src/features/stock/components/stock-purchase-wizard.tsx` | Mesmo atributo no passo da foto histórica |
| `docs/manual-usuario/03-guia-dos-modulos.md` | Uma frase: no celular dá para fotografar a nota |
| `docs/manual-usuario/MANUAL-COMPLETO.md` | O mesmo passo, se continuar duplicado |
| `docs/fixtures/ROTEIRO-registrar-compra.md` | Nota de homologação no celular |
| `docs/state/PENDENCIAS.md` | Homologação iPhone/Android desta fatia, se ficar aberta |
| `docs/manual-dev/22-sugestao-itens-planilha.md` | Uma frase de que a origem da foto pode ser a câmera nativa |

### Proibido nesta feature

- `getUserMedia`, componente de scanner, nova rota, nova action, migration.
- Alterar `extract-purchase-sheet.ts`, schemas de leitura ou a chave OpenAI.
- Alterar `.env` / `.env.example`.
- Guardar a foto da sugestão.
- Specs de outras fatias, salvo esta.

**Branch sugerida (após aprovação):** `feature/captura-camera-planilha`.

---

## 12. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | Câmera nativa do sistema via `capture="environment"`, não viewfinder no app |
| 2 | Os dois campos de foto do assistente recebem o atributo |
| 3 | Galeria e desktop permanecem |
| 4 | Leitura, Storage e papéis não mudam |
| 5 | Sem custo extra de modelo: uma foto, um pedido, como hoje |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| iOS abrir só a câmera e esconder a galeria | Aceitar o comportamento do sistema; desktop e “escolher arquivo” cobrem a fixture |
| Foto grande estourar o body da action | Limite já em 11 MB no `next.config` |
| Pessoa achar que fotografar já gravou o estoque | Copy e o botão de sugestão / confirmar continuam separados |

---

## 14. Referências

- Sugestão de itens: `specs/2026-09-23-sugestao-itens-planilha-vision.md`
- Manual: `docs/manual-dev/22-sugestao-itens-planilha.md`
- Roteiro: `docs/fixtures/ROTEIRO-registrar-compra.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

**Não há implementação enquanto esta spec estiver em draft.** Depois da aprovação explícita no chat, a branch sugerida é `feature/captura-camera-planilha`.
