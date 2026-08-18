# Spec · Fase 5 · Insumos e estoque

| Campo            | Valor                          |
| ---------------- | ------------------------------ |
| **Status**       | draft                          |
| **Data**         | 2026-08-18                     |
| **Slug**         | fase-5-insumos-estoque         |
| **Plano origem** | `docs/PLANO.md` §6             |
| **Fase**         | 5 de `docs/PLANO.md`           |

---

## 1. Contexto

As Fases 1 a 4 entregaram modelo de dados de estoque (já persistido com políticas de acesso), autenticação por papel, agenda operacional, prontuário, fila Kanban com link público e buckets privados para planilhas e etiquetas. As telas **Estoque** (`/estoque`) e **Scan QR** (`/estoque/scan`) continuam **placeholders**: busca desabilitada, cadastro inexistente, leitor de câmera simulado, saldo estático.

Esta feature coloca o **controle de insumos em operação real**, com foco no **celular da auxiliar de sala** em pé diante do armário: escanear QR do pacote, confirmar retirada e ver o saldo cair automaticamente. Complementa o fluxo administrativo de cadastro de insumos, registro da planilha de compra (foto + digitação manual, **sem OCR**) e impressão de etiquetas por pacote.

**Pré-requisito:** Fases 1 a 4 concluídas e aprovadas (papéis com fronteira estoque/scan definida, buckets `supply-sheets` e `supply-labels`, HTTPS no dev para câmera).

---

## 2. Objetivo

Permitir **cadastro de insumos com estoque mínimo**, **entrada de estoque via planilha fotografada e digitação manual**, **geração de QR por pacote com folha imprimível de etiquetas**, **retirada por leitura de câmera** (nativa ou alternativa WebAssembly no iPhone), **modo de leitura contínua** para vários pacotes seguidos, **alertas de estoque crítico na Hoje** e **atalho instalável na tela inicial** do celular apontando direto para o scan.

**Valor entregue:** a auxiliar retira um pacote pelo celular (iPhone e Android), o saldo atualiza sozinho e a recepção vê alertas de reposição no painel do dia, sem planilha paralela.

---

## 3. Atores

| Ator             | Interesse                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Administrador    | Cadastrar insumos, enviar foto da planilha, registrar pacotes, gerar etiquetas, ajustes de saldo |
| Auxiliar de sala | Escanear QR, confirmar retiradas em modo contínuo, registrar pacotes recebidos |
| Recepção         | Consultar saldos e alertas; **sem** acesso ao scan                        |
| Dentista         | Consultar saldos e alertas (somente leitura)                              |
| Visualizador     | **Sem** acesso ao módulo Estoque (mantido da Fase 1)                      |
| Desenvolvedor    | Regras de saldo testadas; leitor QR com fallback; PWA documentada         |

---

## 4. Modelo de domínio

### 4.1 Insumo

Material consumível da clínica. Campos relevantes (já persistidos na Fase 1):

- **Nome** (obrigatório, ex.: "Luva nitrílica M").
- **Unidade de medida:** unitário, caixa, rolo ou frasco.
- **Quantidade atual** (saldo agregado; nunca negativo).
- **Estoque mínimo** (limite para alerta operacional; default 0).
- **Momento** de criação e última atualização.

Situação derivada (não persistida como enum separado):

- **OK:** quantidade atual ≥ estoque mínimo (ou mínimo = 0).
- **Abaixo do mínimo:** quantidade atual &lt; estoque mínimo e mínimo &gt; 0.
- **Zerado:** quantidade atual = 0.

### 4.2 Pacote de insumo

Unidade física identificável por **QR único** na clínica:

- **Insumo** vinculado (obrigatório).
- **Código do QR** (valor codificado na etiqueta; único em toda a clínica).
- **Quantidade inicial** do pacote (&gt; 0).
- **Quantidade restante** no pacote (≤ quantidade inicial; atualizada a cada retirada).
- **Lote** (opcional).
- **Validade** (opcional, data).
- **Situação:** ativo, esgotado ou vencido.

Regras:

- Pacote **esgotado** quando quantidade restante = 0.
- Pacote **vencido** quando validade informada é anterior à data de hoje (America/Sao_Paulo); situação atualizada na leitura ou por rotina leve ao abrir detalhe (não exige cron dedicado nesta fase).
- QR de pacote esgotado ou vencido: leitura permitida com **aviso forte**; retirada **bloqueada** salvo confirmação explícita de override pelo administrador (decisão fechada §12: auxiliar **não** faz override).

### 4.3 Movimentação de estoque

Registro imutável de alteração de saldo:

- **Insumo** afetado.
- **Pacote** (opcional; obrigatório em retirada via scan).
- **Tipo:** entrada, saída ou ajuste.
- **Quantidade** (&gt; 0).
- **Responsável** (colaborador autenticado).
- **Observação** (opcional).
- **Momento** da operação.

Efeito no saldo:

| Tipo     | Efeito na quantidade atual do insumo      | Efeito no pacote (se houver)     |
| -------- | ----------------------------------------- | -------------------------------- |
| Entrada  | + quantidade                              | + quantidade restante (recebimento de pacote novo) |
| Saída    | − quantidade                              | − quantidade restante            |
| Ajuste   | ± quantidade conforme sinal informado     | Sem pacote vinculado             |

Toda movimentação de **saída** e **entrada** vinculada a pacote ocorre em **operação atômica**: gravar movimentação, atualizar saldo do insumo e quantidade restante do pacote (e situação do pacote se esgotar). Falha parcial **não** é permitida.

### 4.4 Planilha de compra (foto)

Registro da **foto da planilha física** enviada pela administração:

- **Arquivo** privado no armazenamento (JPEG, PNG ou WebP).
- **Responsável** pelo envio.
- **Momento** do upload.

A foto é **referência visual** para digitação manual dos itens na mesma sessão ou posteriormente. **Não há OCR** nem extração automática de itens.

### 4.5 Fluxo planilha + digitação

Sessão administrativa em que:

1. Administrador envia foto da planilha (opcional mas recomendado).
2. Administrador **digita manualmente** um ou mais itens: nome do insumo (novo ou existente), unidade, quantidade recebida, estoque mínimo sugerido, lote e validade por pacote.
3. Para cada pacote físico recebido, o sistema **gera código QR único**, cria pacote com situação ativa, registra **entrada** e incrementa saldo.

Itens digitados **sem** gerar pacote (ex.: material a granel sem QR nesta remessa) podem registrar apenas **entrada** ou criação de insumo com saldo inicial, conforme formulário §6.4.

### 4.6 Folha de etiquetas

Saída imprimível (navegador) com uma ou mais etiquetas contendo:

- QR legível por câmera.
- Nome resumido do insumo.
- Lote e validade (se informados).
- Quantidade do pacote.

Layout pensado para impressão em folha A4 com grade de etiquetas (ex.: 3×8 ou equivalente responsivo). **Não** exige integração com impressora térmica nesta fase.

### 4.7 Leitor de QR (scan)

Componente de interface isolado atrás de abstração única (`stock-qr-scanner` ou equivalente):

- **Preferência:** API nativa de detecção de código de barras do navegador, quando disponível.
- **Alternativa:** decodificador WebAssembly (`zxing-wasm`) quando nativa ausente (Safari iPhone).
- **Câmera traseira** por padrão em dispositivos móveis.
- **Lanterna** quando o aparelho expõe controle de torch.
- **Área de leitura recortada** (viewfinder) para acelerar decodificação e guiar o enquadramento.
- Exige **contexto seguro** (HTTPS ou localhost); alinhado à Fase 0.

### 4.8 Modo de leitura contínua

Após retirada confirmada com sucesso:

- Permanece na tela de câmera **sem** voltar à lista de insumos.
- Exibe confirmação breve (toast ou banner) com nome do insumo e quantidade retirada.
- Emite **feedback sonoro** curto e **vibração tátil** (`navigator.vibrate`) quando suportado.
- Prepara próxima leitura imediatamente.
- Leitura duplicada do **mesmo QR** em intervalo &lt; 3 s: ignorada ou mensagem "Pacote já processado" (anti-duplo toque).

---

## 5. Matriz de acesso (estoque)

Coerente com a Fase 1; refinamentos onde a UI expõe ações.

| Ação                                      | admin | reception | dentist | room_assistant | viewer |
| ----------------------------------------- | :---: | :-------: | :-----: | :------------: | :----: |
| Listar insumos e saldos                   |  Sim  |    Sim    |   Sim   |      Sim       |  Não   |
| Cadastrar / editar insumo e mínimo        |  Sim  |    Não    |   Não   |      Não       |  Não   |
| Enviar foto de planilha                   |  Sim  |    Não    |   Não   |      Não       |  Não   |
| Digitar itens / registrar pacotes (entrada)| Sim  |    Não    |   Não   |      Sim*      |  Não   |
| Gerar folha de etiquetas                  |  Sim  |    Não    |   Não   |      Sim       |  Não   |
| Ajuste manual de saldo                    |  Sim  |    Não    |   Não   |      Não       |  Não   |
| Scan QR · retirada (`/estoque/scan`)      |  Sim  |    Não    |   Não   |      Sim       |  Não   |
| Ver histórico de movimentações            |  Sim  |    Sim    |   Sim   |      Sim       |  Não   |
| Ver alertas na Hoje                       |  Sim  |    Sim    |   Sim   |      Não†      |  Não   |

**\*** Auxiliar registra **pacotes e entradas** recebidos no armário; **não** edita cadastro base do insumo (nome, unidade, mínimo).

**†** Auxiliar não acessa `/hoje` (matriz Fase 1); alertas operacionais para ela são visíveis **no detalhe do insumo** e via feedback imediato no scan.

Escrita continua restrita conforme políticas da Fase 1; UI espelha a matriz.

---

## 6. Escopo funcional

### 6.1 Feature `stock`

Estrutura em `src/features/stock/`:

- **Consultas de leitura:** listagem de insumos com saldo e situação, detalhe com pacotes ativos, movimentações recentes, insumos abaixo do mínimo, resumo para Hoje.
- **Ações de escrita:** CRUD de insumo (admin), upload de planilha, registrar pacote(s) com entrada, retirada via scan, ajuste de saldo (admin).
- **Esquemas** Zod compartilhados.
- **Regras de domínio puras** testáveis: cálculo de saldo, validação de retirada, situação do pacote, detecção abaixo do mínimo, formato do código QR.
- **Componentes:** lista com busca, formulários, detalhe, gerador de etiquetas, leitor QR isolado.

### 6.2 Tela Estoque (`/estoque`)

Substituir placeholder por:

- **Lista de insumos** com busca por nome (debounce), badge de situação (OK / Abaixo do mínimo / Zerado).
- Colunas ou cards: nome, unidade, quantidade atual, mínimo.
- Ação **Novo insumo** (admin).
- Ação **Registrar compra / planilha** (admin): upload de foto + formulário de digitação §6.4.
- Link **Scan QR · retirada** (admin e auxiliar).
- Toque no insumo abre **detalhe** §6.3.

Mobile-first na lista (cards empilhados); tabela opcional a partir de `md`.

### 6.3 Detalhe do insumo

- Resumo: saldo, mínimo, unidade, situação.
- **Pacotes ativos** com QR (somente metadados; QR completo visível ao gerar etiqueta ou para admin).
- **Histórico de movimentações** (últimas N, paginação simples ou "carregar mais").
- Ações contextuais por papel: **Ajustar saldo** (admin), **Adicionar pacote** (admin/auxiliar), **Imprimir etiquetas** dos pacotes selecionados.

### 6.4 Fluxo planilha + digitação manual

Wizard ou sheet em etapas:

1. **Foto (opcional):** captura ou galeria; upload para bucket privado `supply-sheets`; registro em planilha de compra.
2. **Itens:** linhas repetíveis com:
   - Insumo (select de existente ou criar novo inline: nome + unidade + mínimo).
   - Quantidade por pacote.
   - Quantidade de pacotes idênticos (ex.: 5 caixas iguais → 5 QR distintos).
   - Lote e validade (opcionais, replicados nos pacotes da linha).
3. **Revisão:** total de entradas e pacotes a criar.
4. **Confirmar:** para cada pacote, gera QR único, registra entrada, incrementa saldo.

Validações:

- Pelo menos um item ou pacote na sessão.
- Quantidades &gt; 0.
- Nome de insumo novo não vazio.

**Sem OCR:** copy explícita na UI: "Digite os itens manualmente a partir da foto."

### 6.5 Geração de QR e folha de etiquetas

- Código QR: string única prefixada `CR-` + identificador aleatório (ex.: 12 caracteres alfanuméricos); codificada no QR como texto puro.
- Biblioteca de geração de QR no client ou server (SVG/PNG para impressão).
- Página ou modal **Imprimir etiquetas** com layout print-friendly (`@media print`).
- Seleção de pacotes no detalhe do insumo ou ao final do wizard de compra.
- Opcional: download PNG individual por pacote (desejável, não bloqueante).

Bucket `supply-labels` permanece disponível para evolução; **não** é obrigatório persistir imagem de etiqueta no DoD (geração on-demand basta).

### 6.6 Tela Scan QR (`/estoque/scan`)

Substituir placeholder por fluxo real, **mobile-first**, tela cheia ou quase:

- **Modo contínuo** ligado por padrão (toggle para desligar).
- Viewfinder central, instrução "Aponte para o QR do pacote".
- Ao decodificar:
  1. Busca pacote pelo código (server action ou query).
  2. Exibe card de confirmação: insumo, lote, validade, quantidade restante, aviso se vencido/esgotado.
  3. Quantidade a retirar (default = quantidade restante; editável se retirada parcial permitida §12).
  4. Botão **Confirmar retirada** (≥ 44×44 px, metade inferior da tela).
  5. Sucesso → feedback §4.8 → volta ao viewfinder.
- Botão **Lanterna** quando disponível.
- Botão **Trocar câmera** secundário (se frontal/traseira).
- Estado sem permissão de câmera: mensagem clara + link para configurações do navegador.
- **Sem** shell pesado: minimizar distrações; safe-area; fonte 16px nos campos numéricos.

Leitor isolado em `src/features/stock/components/stock-qr-scanner.tsx` (ou pasta `scanner/`) com interface:

```typescript
interface StockQrScanResult {
  rawCode: string;
}
```

Implementações internas: `native-barcode-scanner` e `zxing-wasm-scanner`; escolha em runtime.

### 6.7 Retirada (baixa)

Ao confirmar:

1. Validar pacote ativo, quantidade solicitada ≤ restante, saldo insumo suficiente.
2. Validar papel (`admin` ou `room_assistant`).
3. Em transação: movimentação **saída**, decremento saldo insumo, decremento restante pacote, atualizar situação pacote se esgotado.
4. Retornar confirmação com saldo atualizado do insumo.

Responsável e horário vêm da sessão e timestamp server-side.

### 6.8 Ajuste de saldo (admin)

Formulário restrito:

- Insumo, quantidade, direção (positiva/negativa), observação obrigatória.
- Tipo **ajuste**; sem pacote vinculado.
- Impede saldo negativo resultante.

### 6.9 Alertas na Hoje (`/hoje`)

Nova seção **Estoque · abaixo do mínimo**:

- Lista insumos onde quantidade atual &lt; estoque mínimo (mínimo &gt; 0).
- Exibe: nome, saldo atual, mínimo, unidade.
- Link **Abrir estoque**.
- Ordenação: mais crítico primeiro (maior déficit relativo ou absoluto).
- Visível para admin, recepção e dentista (leitura).
- Se nenhum alerta: mensagem positiva ou omissão da lista (decisão fechada §12: **sempre** mostrar seção com "Nenhum insumo abaixo do mínimo").

### 6.10 PWA · atalho para scan

- `manifest.webmanifest` (ou `manifest.json`) com nome, ícones (192 e 512), `theme_color`, `background_color`.
- **`start_url`** padrão `/hoje`; **atalho** (`shortcuts`) "Scan estoque" → `/estoque/scan`.
- Ícones em `public/icons/` (PNG; pode derivar da marca Neo Roma).
- Metadados linkados no layout raiz (`manifest`, `apple-touch-icon`).
- Objetivo: auxiliar instala na tela inicial e abre scan em um toque.

Escopo mínimo: instalável + ícone + atalho; **service worker offline** fica fora do escopo §7.

### 6.11 Persistência · reforços incrementais

Nova migration incremental (não reescrever `004_stock.sql`):

- Coluna **quantidade restante** em pacotes (inicializada = quantidade inicial; backfill para pacotes existentes no seed).
- Função ou trigger para **consistência** saldo ↔ movimentações (recomendado: trigger AFTER INSERT em movimentações atualiza insumo e pacote).
- Restrição CHECK: quantidade restante ≥ 0 e ≤ quantidade inicial.
- Índice em código QR (já UNIQUE; confirmar performance).
- Opcional: coluna **planilha vinculada** em movimentações de entrada da mesma sessão (auditoria); se omitida, observação livre basta.

Regenerar tipos TypeScript após aplicar migration.

### 6.12 Seed de desenvolvimento

Estender seed idempotente:

- Pelo menos **5 insumos** (ex.: luva, alginate, babador, anestésico, fio).
- Pelo menos **3 pacotes ativos** com QR conhecidos documentados no manual-dev (ex.: `CR-DEV001`, `CR-DEV002`).
- Um insumo **abaixo do mínimo** para testar alerta na Hoje.
- Conta **auxiliar** já existente no seed Fase 1.

### 6.13 Componentes de UI

Reutilizar shadcn existente; adicionar somente se necessário (sheet para wizard, toast/sonner para scan, badge de situação).

Dependências previstas:

- **`zxing-wasm`** (ou equivalente mantido) para fallback iOS.
- **`qrcode`** (ou `react-qr-code`) para geração de etiquetas.

Copy em pt-BR; sem travessão "—" em textos novos; inputs 16px; safe-area no scan.

---

## 7. Fora de escopo

- OCR ou IA para ler planilha fotografada.
- Integração com fornecedor, nota fiscal eletrônica ou ERP externo.
- Impressora térmica dedicada ou ZPL.
- Service worker / modo offline completo (apenas manifest instalável).
- Inventário cíclico com contagem cega e reconciliação avançada.
- Multi-armazém ou localização física de prateleira.
- Rastreio por paciente ("este insumo foi usado na consulta X") — ligação com prontuário fica para evolução.
- Notificação push ou e-mail de estoque baixo (alerta só na Hoje e na lista).
- Audit log dedicado a cada leitura de estoque (opcional; não bloqueia DoD).
- Lembrete pós-consulta, deploy produção, homologação `manual-report` (Fase 6).
- Testes E2E / Playwright.
- Alteração da matriz de papéis ou novas migrations de domínios alheios ao estoque.
- Recepção acessar scan (mantido Fase 1).

---

## 8. Fluxos

### 8.1 Caminho feliz · Admin cadastra insumo

1. Admin autentica e abre **Estoque**.
2. Aciona **Novo insumo**: nome "Luva nitrílica M", unidade unitário, mínimo 20, saldo inicial 0.
3. Sistema persiste insumo; card aparece na lista como **Zerado** ou **Abaixo do mínimo** conforme saldo.
4. Insumo visível para recepção e dentista (somente leitura).

### 8.2 Caminho feliz · Compra com planilha e pacotes

1. Admin aciona **Registrar compra / planilha**.
2. Fotografa planilha de compra; upload concluído.
3. Digita linha: insumo "Luva nitrílica M", 100 unidades por pacote, 3 pacotes, lote L2026-08, validade 2027-08-01.
4. Revisa: 3 entradas, 3 QR distintos.
5. Confirma; sistema cria 3 pacotes, 3 movimentações de entrada, saldo do insumo +300.
6. Abre **Imprimir etiquetas**; imprime folha A4 com 3 QR.
7. Cola etiquetas nos pacotes físicos.

### 8.3 Caminho feliz · Auxiliar retira pacote no celular (critério principal do plano)

1. Auxiliar autentica no iPhone (HTTPS local ou produção).
2. Abre **Scan QR** (ou atalho PWA na tela inicial).
3. Concede permissão de câmera; viewfinder ativo, câmera traseira.
4. Escaneia QR `CR-DEV001` de um pacote de luvas.
5. Vê confirmação: "Luva nitrílica M · 100 un · Lote L2026-08".
6. Mantém quantidade default 100; toca **Confirmar retirada**.
7. Som curto + vibração; toast "Retirada registrada · Saldo: 200".
8. Câmera permanece ativa (**modo contínuo**).
9. Saldo na lista de insumos e no detalhe reflete 200 **sem recarregar manualmente** (revalidação).
10. Repetir fluxo equivalente em **Android** (Chrome, WebM/Opus irrelevante aqui; foco câmera + zxing fallback se necessário).

### 8.4 Caminho feliz · Vários pacotes seguidos (modo contínuo)

1. Auxiliar escaneia pacote A → confirma → feedback.
2. Imediatamente escaneia pacote B → confirma → feedback.
3. Não navega de volta à lista entre A e B.
4. Terceiro scan do mesmo pacote A em &lt; 3 s → ignorado ou aviso de duplicidade.

### 8.5 Caminho feliz · Alerta na Hoje

1. Após retiradas, insumo "Anestésico" fica com saldo 2 e mínimo 5.
2. Recepção abre **Hoje**.
3. Seção **Estoque · abaixo do mínimo** lista "Anestésico · 2 de 5 frascos".
4. Link leva a `/estoque`.

### 8.6 Caminho feliz · Admin ajusta saldo após inventário

1. Admin abre detalhe do insumo; saldo físico diverge (quebra).
2. Aciona **Ajustar saldo**: −3 unidades, obs. "Perda por validade".
3. Movimentação tipo ajuste registrada; saldo atualizado.

### 8.7 Caminho feliz · Dentista consulta estoque

1. Dentista abre **Estoque**; vê saldos; **não** vê botões de cadastro ou scan (UI oculta).
2. Tentativa de escrita via action server-side recusada.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| QR desconhecido | Mensagem "Pacote não encontrado"; permanece no scan | Lookup server-side; mensagem genérica |
| Pacote esgotado | Card aviso; botão confirmar desabilitado | Checar situação antes da retirada |
| Pacote vencido | Banner vermelho; retirada bloqueada para auxiliar | Validar validade; override só admin no detalhe |
| Quantidade retirada &gt; restante | Validação inline; POST rejeitado | Zod + constraint transação |
| Saldo insumo insuficiente para saída | Erro "Saldo insuficiente" | Validar antes de persistir |
| Câmera negada | Tela explicativa; botão tentar novamente | Feature detection + copy clara |
| HTTP (sem HTTPS) | Câmera não inicia; aviso de contexto seguro | Dev com `--experimental-https` |
| Safari iPhone sem BarcodeDetector | Fallback zxing-wasm transparente | Detecção em runtime §4.7 |
| Lanterna não suportada | Botão oculto ou desabilitado | `track.getCapabilities()` |
| Duplo scan do mesmo QR | Ignorar ou aviso §4.8 | Debounce por código |
| Recepção acessa `/estoque/scan` | 403 acesso negado | Guarda layout Fase 1 |
| Auxiliar tenta cadastrar insumo | UI sem ação; action recusa | Matriz §5 |
| Upload planilha &gt; limite bucket | Erro amigável | 10 MB alinhado migration storage |
| MIME inválido na planilha | Rejeitar upload | Whitelist JPEG/PNG/WebP |
| Nome insumo duplicado | Permitir (homônimos) ou aviso soft | Decisão §12: permitir com aviso |
| Impressão sem pacotes selecionados | Botão desabilitado | Validar seleção |
| Concorrência duas retiradas simultâneas no mesmo pacote | Segunda falha "Quantidade indisponível" | Transação serializável / row lock |
| PWA não instalável em iOS | Atalho via "Adicionar à Tela de Início" manual | Documentar no manual-dev |
| Vibrate não suportado (iOS) | Som visual basta; sem erro | Progressive enhancement |
| Sessão expirada no scan | Redirect login; scan interrompido | Middleware |
| Insumo deletado com pacotes ativos | Bloquear exclusão | ON DELETE RESTRICT ou soft delete fora escopo |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Feature `src/features/stock/` conforme §6.
- [ ] Migration incremental aplicada via `npm run db:push`; tipos regenerados.
- [ ] `/estoque` substitui placeholder: lista com busca, situação, detalhe, cadastro admin.
- [ ] Fluxo planilha + digitação manual **sem OCR** operacional (§6.4).
- [ ] Geração de QR único por pacote e folha imprimível de etiquetas (§6.5).
- [ ] `/estoque/scan` funcional: câmera traseira, viewfinder, nativo + fallback wasm.
- [ ] Retirada registra responsável e horário; saldo decrementado atomicamente.
- [ ] Modo leitura contínua com feedback sonoro e tátil (§4.8).
- [ ] Lanterna quando suportada; safe-area e alvos ≥ 44×44 px no scan.
- [ ] **Hoje:** seção estoque abaixo do mínimo (§6.9).
- [ ] PWA: manifest, ícones, atalho para scan (§6.10).
- [ ] Testes unitários Vitest: saldo após movimentações, validação retirada, abaixo do mínimo, transições de situação do pacote (meta ~80% no domínio tocado).
- [ ] Autorização revalidada em toda action; RLS da Fase 1 intacta.
- [ ] Zod na borda de todas as actions de estoque.
- [ ] Seed: insumos demo + QR documentados + um abaixo do mínimo.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: buckets privados, sem segredo no client, fail secure.
- [ ] **Validação manual obrigatória em iPhone e Android reais:** fluxo §8.3 completo (scan → retirada → saldo atualizado).
- [ ] `docs/implementation/F5-insumos-estoque.md` criado; índice `docs/implementation/README.md` atualizado.
- [ ] `docs/manual-dev/07-fase-5-insumos-estoque.md` criado; índice `docs/manual-dev/README.md` atualizado.
- [ ] `docs/state/PENDENCIAS.md` atualizado (implementação vs homologação manual).

### Qualidade

- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Nenhum arquivo alterado fora do escopo permitido (§11).
- [ ] Arquivos novos respeitam limite de ~300 linhas; dividir por domínio se necessário.
- [ ] Leitor QR isolado em componente único (trocar implementação sem reescrever tela).
- [ ] Validação manual desktop: admin cadastra, gera etiquetas, vê alerta na Hoje.
- [ ] Validação manual mobile auxiliar: modo contínuo com 3 pacotes distintos.

### Explicitamente **não** exigido nesta fase

- Homologação `manual-report` completa (Fase 6).
- OCR de planilha.
- Service worker offline.
- Cobertura 80% global do repositório (apenas domínio tocado).
- Teste Playwright.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo / pasta | Motivo |
| --------------- | ------ |
| `specs/2026-08-18-fase-5-insumos-estoque.md` | Esta spec |
| `supabase/migrations/016_stock_f5.sql` | Quantidade restante, trigger saldo, constraints |
| `supabase/migrations/017_seed_stock_dev.sql` | Insumos, pacotes e QR demo |
| `src/features/stock/queries.ts` | Leitura insumos, pacotes, alertas, movimentações |
| `src/features/stock/actions.ts` | CRUD, upload, pacotes, retirada, ajuste |
| `src/features/stock/schemas.ts` | Zod insumo, pacote, movimentação, retirada |
| `src/features/stock/domain/stock-balance.ts` | Cálculo e validação de saldo |
| `src/features/stock/domain/stock-balance.test.ts` | Testes saldo |
| `src/features/stock/domain/supply-status.ts` | OK / abaixo mínimo / zerado |
| `src/features/stock/domain/supply-status.test.ts` | Testes situação |
| `src/features/stock/domain/package-status.ts` | Ativo / esgotado / vencido |
| `src/features/stock/domain/package-status.test.ts` | Testes pacote |
| `src/features/stock/domain/qr-code.ts` | Geração e validação formato CR- |
| `src/features/stock/domain/qr-code.test.ts` | Testes QR |
| `src/features/stock/domain/withdrawal.ts` | Regras retirada parcial/total |
| `src/features/stock/domain/withdrawal.test.ts` | Testes retirada |
| `src/features/stock/components/stock-list.tsx` | Lista com busca |
| `src/features/stock/components/stock-supply-form.tsx` | Cadastro/edição insumo |
| `src/features/stock/components/stock-supply-detail.tsx` | Detalhe + histórico |
| `src/features/stock/components/stock-purchase-wizard.tsx` | Planilha + digitação |
| `src/features/stock/components/stock-package-form.tsx` | Adicionar pacote avulso |
| `src/features/stock/components/stock-label-sheet.tsx` | Folha imprimível QR |
| `src/features/stock/components/stock-adjustment-form.tsx` | Ajuste admin |
| `src/features/stock/components/stock-qr-scanner.tsx` | Fachada do leitor |
| `src/features/stock/components/scanner/native-barcode-scanner.tsx` | BarcodeDetector |
| `src/features/stock/components/scanner/zxing-wasm-scanner.tsx` | Fallback iOS |
| `src/features/stock/components/stock-scan-flow.tsx` | Confirmação + modo contínuo |
| `src/features/stock/lib/apply-withdrawal.ts` | Transação retirada (server) |
| `src/features/stock/lib/apply-stock-entry.ts` | Transação entrada pacote |
| `src/app/manifest.ts` ou `public/manifest.webmanifest` | PWA manifest |
| `public/icons/icon-192.png`, `icon-512.png` | Ícones PWA |
| `docs/plans/plano-F5.md` | Plano derivado opcional |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/app/(app)/estoque/page.tsx` | Integrar lista real |
| `src/app/(app)/estoque/scan/page.tsx` | Integrar scan flow |
| `src/app/(app)/hoje/page.tsx` | Alertas estoque §6.9 |
| `src/app/layout.tsx` | Link manifest, apple-touch-icon, theme-color |
| `src/lib/supabase/database.types.ts` | Tipos regenerados |
| `package.json` | `zxing-wasm`, lib QR (ex.: `qrcode`) |
| `README.md` | Fluxo estoque, QR dev, PWA, teste HTTPS mobile |
| `.env.example` | Notas se variável nova (improvável) |

### Pode incluir no commit (não bloqueia DoD)

| Path | Nota |
| ---- | ---- |
| `src/components/ui/sheet.tsx`, `sonner.tsx`, `badge.tsx` | shadcn se necessário |
| `docs/plans/plano-F5.md` | Espelho do plano de fase |

### Proibido alterar nesta feature

- `src/features/waitlist/**`, `records/**`, `agenda/**` (salvo tipos compartilhados indiretos).
- `src/features/patients/**` exceto reutilização via import (sem refactor amplo).
- Políticas RLS de prontuário, fila (salvo migration 016 focada em estoque).
- `src/lib/auth/roles.ts` (matriz já correta; mudança exige nova spec).
- `docs/SECURITY.md`.
- `.env.local` ou qualquer arquivo com segredos reais.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Planilha: **foto + digitação manual**; **sem OCR** |
| 2 | Formato QR: texto `CR-` + identificador aleatório único |
| 3 | Retirada parcial **permitida** (quantidade editável ≤ restante do pacote) |
| 4 | Pacote esgotado ou vencido: **bloqueio** de retirada para auxiliar; override **somente admin** no detalhe (fora do scan) |
| 5 | Leitor: **BarcodeDetector** primeiro; **zxing-wasm** fallback; interface única |
| 6 | Scan: **câmera traseira** default; **lanterna** se suportada; **viewfinder** recortado |
| 7 | **Modo contínuo** ligado por padrão; feedback **som + vibração** |
| 8 | Duplo scan mesmo QR &lt; 3 s: **ignorar** ou aviso (anti-duplicidade) |
| 9 | Saldo: atualização **atômica** com movimentação (trigger ou transação explícita) |
| 10 | Cadastro base de insumo: **somente admin**; auxiliar registra pacotes/entradas |
| 11 | Recepção e dentista: **leitura**; recepção **sem** scan |
| 12 | Hoje: seção alertas **sempre visível** (lista ou mensagem "nenhum abaixo do mínimo") |
| 13 | PWA: manifest + ícones + **shortcut** scan; **sem** service worker offline |
| 14 | Etiquetas: impressão **on-demand** via browser; persistir PNG no bucket **opcional** |
| 15 | Nomes de insumo duplicados: **permitidos** com aviso soft na UI |
| 16 | Migration incremental **016**; não editar retroativamente `004` |
| 17 | Teste **obrigatório** iPhone + Android real antes de fechar (PLANO §7) |
| 18 | Ajuste de saldo: **somente admin**, observação **obrigatória** |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| QR não lê no iPhone | Fallback wasm §4.7; teste real §10 |
| Câmera bloqueada sem HTTPS | Dev HTTPS Fase 0; doc manual-dev |
| Saldo inconsistente com movimentações | Trigger/transação + testes Vitest |
| Duplo scan decrementa duas vezes | Debounce + transação idempotente por pacote/intervalo |
| Performance wasm no iPhone antigo | Viewfinder reduz resolução de análise |
| PWA iOS limitado | Shortcut + instrução "Adicionar à Tela de Início" |
| Auxiliar sem acesso Hoje perde alerta | Alertas no detalhe do insumo; PWA aponta scan |
| Permissão câmera negada permanentemente | Copy com passo a passo iOS/Android |
| Impressão de etiquetas ilegível | Contraste alto; teste impressão real desejável |
| Escopo inflar para OCR | Fora de escopo §7 |

---

## 14. Referências

- `docs/PLANO.md` · §4 Estratégia mobile (QR) · §5 Estoque · §6 Fase 5 · §7 Qualidade (teste mobile Fase 5)
- `docs/SECURITY.md` · buckets privados, autorização server-side
- `specs/2026-08-18-fase-1-dados-auth-papeis.md` · §4.4 Estoque · §5 Matriz scan
- `specs/2026-08-18-fase-0-fundacao.md` · HTTPS dev, safe-area, alvos de toque
- `docs/manual-dev/03-fase-1-dados-auth-papeis.md` · migration 004, contas auxiliar
- `.cursor/rules/architecture.mdc` · buckets supply-sheets, supply-labels
- `supabase/migrations/004_stock.sql` · modelo base
- `supabase/migrations/007_storage.sql` · políticas buckets estoque

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch dedicada (sugestão: `feature/fase-5-insumos-estoque`), sem expandir escopo.
