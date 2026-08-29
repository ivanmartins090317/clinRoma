# Spec · Tela de QR da sessão WhatsApp

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-29                                         |
| **Slug**         | tela-qr-whatsapp                                   |
| **Plano origem** | `docs/plans/plano-tela-qr-whatsapp.md`             |
| **Fase**         | Fatia operacional (F7, passo 6 da arquitetura). **Não** fecha a Fase 7 |
| **Autonomia**    | medium                                             |
| **PRD / vault**  | decisão `2026-08-29-tela-qr-whatsapp` · ajuste: recepção com escrita |

---

## 1. Contexto

O ClinRoma já **dispara** WhatsApp ao paciente (pós-cirurgia, convite de anamnese, oferta da fila). O inbox e o bot ficam fora deste repositório. O número da clínica vive num **gateway** separado. Hoje, para parear ou reconectar esse número, a equipe teria que abrir o painel do gateway. Isso não entra no dia a dia da recepção.

A equipe precisa **parear o número da clínica de dentro do ClinRoma**. A chave do gateway **nunca** vai ao navegador. O aplicativo no servidor fala com o gateway; a tela só mostra o que o servidor autorizou.

O status que o menu e a Hoje mostram **não** vem do gateway a cada render. Vem do **status persistido** da sessão da clínica, atualizado quando o gateway avisa que a sessão mudou. Sem esse aviso configurado no gateway, o indicador fica velho.

Esta spec cobre **só a tela de pareamento**, o indicador e o card na Hoje. Não fecha a Fase 7. Não mexe no contrato de disparo já existente (destino + texto).

**Pré-requisito:** canal de disparo já versionado (F7-04 / F7-05 e fatias que o reutilizam). Ops do aviso de status no gateway **não** é código desta fatia; a homologação da tela **não fecha** sem esse aviso apontando para o aplicativo publicado.

---

## 2. Objetivo

1. Admin e recepção pareiam a sessão **única** da clínica (sessão `default`) **dentro** do ClinRoma: iniciar se estiver parada, ver o QR só enquanto o gateway pede leitura, desconectar se precisar.
2. O ponto do canal fica **verde estável** quando a sessão está em operação; **vermelho piscando** quando não está.
3. Dentista vê só o card na Hoje (sem item de menu, sem tela de pareamento).
4. Auxiliar de sala e visualizador não veem item, tela, chip nem card.

**Valor entregue:** a recepção reconecta o WhatsApp da clínica no expediente, sem dashboard do gateway. O disparo já existente continua o mesmo. Se alguém desconectar, fica explícito que pós-cirurgia, questionário e oferta da fila param.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Parear, ver QR, desconectar; ver chip no menu e card na Hoje com atalho |
| Recepção | Igual ao admin no dia a dia (iniciar, QR, desconectar); chip e card com atalho |
| Dentista | Ver se o canal está no ar **só** no card da Hoje; **não** abre a tela de pareamento |
| Auxiliar de sala | Nada desta feature (continua no scan de estoque) |
| Visualizador | Nada desta feature |
| Gateway WhatsApp da clínica | Mantém a sessão Web; avisa quando o status muda; entrega o QR |
| Paciente | Não usa esta tela. Continua só recebendo disparos se a sessão estiver em operação |

O inbox da recepção (DeskcommCRM) **não** participa.

---

## 4. Modelo de domínio

### 4.1 Sessão da clínica

Existe **uma** sessão operacional neste piloto: a sessão `default`, ligada ao número da **clínica**. Sem segundo número. Sem sessão pessoal do dentista.

O aplicativo **não** é o WhatsApp. Ele pede ao gateway: iniciar, mostrar o QR, encerrar. A chave e o endereço do gateway ficam **só no servidor**.

O contrato de **disparo** (um destino + um texto) **não muda**. Esta fatia só reutiliza a leitura da configuração já existente do canal.

### 4.2 Status da sessão (domínio)

O ClinRoma guarda **um** status por sessão, com a data da última atualização. O menu e a Hoje leem **esse** registro. Não perguntam ao gateway na montagem da página.

| Status no domínio | Significado para a equipe | Indicador | QR na tela |
| ----------------- | ------------------------- | --------- | ---------- |
| `WORKING` | Sessão em operação. Disparos podem sair. | Verde **estável** | Não |
| `STOPPED` | Sessão parada. | Vermelho **piscando** | Não (quem tem escrita **inicia** ao abrir a tela) |
| `SCAN_QR` | Gateway pedindo leitura do QR. | Vermelho **piscando** | **Sim** |
| Qualquer outro (inclui falha e exigência de chave de acesso do aparelho) | Canal **não** está em operação. | Vermelho **piscando** | Não. **Sem** tela extra |

O gateway pode falar `SCAN_QR_CODE`. No domínio isso vira **`SCAN_QR`**. Falha e exigência de chave de acesso do aparelho **não** ganham fluxo próprio: entram no balde “não `WORKING`”.

Não há estado “desconhecido” na interface: se a linha persistida faltar, trata-se como **não em operação** (vermelho), sem quebrar o menu nem a Hoje.

### 4.3 Quem escreve o status persistido

Quem está autenticado no aplicativo **lê** o status (se o papel tiver direito). **Não** grava o status direto.

A gravação acontece quando o **aviso de mudança de sessão** chega do gateway, autenticado por **segredo só de servidor**. Aviso que não for de mudança de sessão é ignorado. Aviso com assinatura inválida ou ausente é recusado; o status antigo permanece.

Depois de gravar, a tela de pareamento, a Hoje e o indicador do menu passam a poder ler o valor novo na próxima renderização. O menu **não** faz consulta contínua ao gateway.

### 4.4 Iniciar, QR e desconectar

Só quem tem **escrita** no módulo WhatsApp (admin e recepção):

| Ação | Quando |
| ---- | ------ |
| **Iniciar** a sessão `default` | Ao **abrir** a tela de pareamento, se o status persistido for `STOPPED`. Não é botão avulso obrigatório neste recorte. |
| **Ver o QR** | Só em `SCAN_QR`. A imagem passa pelo servidor autenticado (sessão + escrita). O navegador **não** fala com o gateway. |
| **Atualizar o QR** | Enquanto estiver em `SCAN_QR`, a tela pede a imagem de novo a cada **3 a 5 segundos**. Fora desse status, **para**. Sem cache público da imagem. |
| **Desconectar** | Com **confirmação**. O diálogo deixa claro que **todos** os disparos (pós-cirurgia, questionário, oferta da fila) param até alguém parear de novo. |

`WORKING`: o QR some e a atualização periódica para.

Dentista, auxiliar e visualizador: o servidor **recusa** iniciar, entregar QR e desconectar.

### 4.5 Indicador no menu e card na Hoje

Os dois leem o **mesmo** status persistido.

| Superfície | Quem vê | O que faz |
| ---------- | ------- | --------- |
| **Chip** no bloco de estado do sistema (menu desktop) | Só admin e recepção | Verde estável se `WORKING`; vermelho piscando se não. |
| **Card** na Hoje | Admin, recepção e dentista | Mesmo verde / vermelho. **Não** embute o QR. |
| **Atalho para a tela de pareamento** | Só quem tem o módulo WhatsApp (admin e recepção) | Link no card. |
| **Dentista no card** | Status **sem** link. Copy: peça à recepção ou ao admin. | |
| **Barra inferior no celular** | **Não** ganha sexto item. Atalho pela Hoje, no mesmo espírito do scan de estoque. | |
| **Item no menu desktop** | Só quem tem o módulo | Leva à tela de pareamento. |

O chip **atrasa** de propósito: só muda depois do aviso do gateway + nova renderização, ou na próxima navegação. A atualização contínua fica **só** na tela de pareamento, e **só** em `SCAN_QR`.

### 4.6 Módulo WhatsApp

Novo módulo da clínica: **WhatsApp** (pareamento da sessão). Não é estoque. Não é prontuário. Não mistura com scan de pacote.

| Papel | Módulo WhatsApp | Chip | Card na Hoje | Tela de pareamento |
| ----- | --------------- | ---- | ------------ | ------------------ |
| admin | escrita | Sim | Sim, com atalho | Sim |
| reception | escrita | Sim | Sim, com atalho | Sim |
| dentist | nenhum | Não | Sim, **sem** atalho | Não (acesso negado) |
| room_assistant | nenhum | Não | Não | Não |
| viewer | nenhum | Não | Não | Não |

A recusa vale na interface **e** no servidor (abrir a tela, iniciar, QR, desconectar).

A barra inferior no celular **continua com cinco itens** (Hoje, Agenda, Pacientes, Fila, Estoque). Scan de estoque e WhatsApp **não** entram nessa barra.

### 4.7 O que esta fatia não é

- Não é inbox, bot, conversa ou fila de atendimento no WhatsApp.
- Não é segundo número nem segunda sessão.
- Não é o painel do gateway nem um quadro embutido desse painel.
- Não é pareamento por chave de acesso do aparelho (além de cair no vermelho).
- Não é mudança do texto ou do destino dos disparos já existentes.

---

## 5. Matriz de acesso

| Ação | admin | reception | dentist | room_assistant | viewer |
| ---- | :---: | :-------: | :-----: | :------------: | :----: |
| Ver item WhatsApp no menu desktop | Sim | Sim | Não | Não | Não |
| Abrir a tela de pareamento | Sim | Sim | Não | Não | Não |
| Iniciar sessão parada | Sim | Sim | Não | Não | Não |
| Ver e atualizar o QR | Sim | Sim | Não | Não | Não |
| Desconectar (com confirmação) | Sim | Sim | Não | Não | Não |
| Ver chip no menu | Sim | Sim | Não | Não | Não |
| Ver card na Hoje | Sim | Sim | Sim | Não | Não |
| Atalho do card para a tela | Sim | Sim | Não | Não | Não |
| Ver item na barra inferior do celular | Não | Não | Não | Não | Não |
| Ler o status persistido (para as superfícies acima) | Sim | Sim | Sim | Não | Não |
| Gravar o status persistido pela sessão autenticada | Não | Não | Não | Não | Não |

O aviso do gateway **não** usa papel de usuário. Entra só com o **segredo** certo. Sem o segredo: recusa, sem gravar.

Falha segura: dentista, auxiliar e visualizador não iniciam, não veem QR e não desconectam, mesmo se inventarem o endereço da tela.

---

## 6. Escopo funcional

### 6.1 Tela de pareamento

Quem tem escrita abre a tela WhatsApp.

1. O aplicativo lê o status persistido da sessão `default`.
2. Se estiver `STOPPED`, **inicia** essa sessão no gateway.
3. Se estiver `SCAN_QR`, mostra a imagem do QR (via servidor) e atualiza a cada 3 a 5 segundos **só nesse estado**.
4. Se estiver `WORKING`, mostra o canal em operação: sem QR, sem atualização periódica.
5. Oferece **Desconectar** com confirmação (mesmo quem tem escrita).

Quem não tem o módulo e tenta o endereço cai em **acesso negado**, igual às outras rotas protegidas.

A tela **não** consulta o gateway para montar o chip do menu. Só a ação de iniciar / QR / desconectar fala com o gateway, no servidor.

### 6.2 Aviso de mudança de sessão

O aplicativo aceita um aviso **público** (sem login de staff) que:

- só trata **mudança de status da sessão**;
- só entra com **assinatura** válida (segredo próprio, não o segredo do relógio dos jobs);
- grava o status da sessão indicada (piloto: `default`);
- não escreve se a assinatura falhar;
- não lê o gateway para “confirmar” o aviso.

Configurar esse aviso **no** gateway (para qual endereço apontar, qual segredo) é **ops**. Sem isso, o indicador não acompanha o pareamento real.

### 6.3 Indicador e Hoje

- Menu: chip novo no bloco de estado do sistema, **só** admin e recepção.
- Hoje: card novo para admin, recepção e dentista. Sem QR no card.
- Link no card **só** se o papel tem o módulo WhatsApp.
- Dentista: texto pedindo recepção ou admin. Sem navegar para a tela.

### 6.4 Configuração de ambiente

Documentar no exemplo de ambiente (valor **vazio**, sem segredo real):

- o segredo do aviso de status da sessão (nome de produto: segredo do aviso WhatsApp).

As três variáveis já existentes do canal (endereço, chave, nome da sessão) **permanecem**. Esta fatia **não** as inventa de novo. Sem elas, iniciar e pedir QR falham de forma visível; o disparo já existente continua no comportamento “canal ausente”.

Não commitar segredo. Não reutilizar o segredo do relógio dos jobs.

### 6.5 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Módulo / item de menu: `WhatsApp`
- Título da tela: `WhatsApp da clínica`
- Ajuda do QR: `Abra o WhatsApp no celular da clínica e leia o código.`
- Em operação: `WhatsApp da clínica conectado.`
- Parado / vermelho: `WhatsApp da clínica desconectado.`
- Chip verde: `WhatsApp ligado`
- Chip vermelho: `WhatsApp desligado`
- Card na Hoje (título): `WhatsApp da clínica`
- Dentista sem atalho: `Peça à recepção ou ao admin para reconectar.`
- Atalho (admin / recepção): `Abrir pareamento`
- Desconectar: `Desconectar`
- Confirmação: `Desconectar o WhatsApp da clínica? As mensagens ao paciente (pós-cirurgia, questionário e oferta da fila) param até alguém parear de novo.`
- Confirmar: `Desconectar agora`
- Cancelar: `Cancelar`
- Sem permissão: `Sem permissão para gerenciar o WhatsApp da clínica.`
- Canal / gateway indisponível: `Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.`
- Acesso negado: o fluxo atual da tela de acesso negado

### 6.6 Teste local e seed

A persistência nasce com a sessão `default` em `STOPPED`. Sem essa linha, menu e Hoje não têm o que ler: tratar como não em operação, sem quebrar.

Testes automatizados cobrem mapa de status, matriz de papéis, assinatura do aviso, e recusa de iniciar / QR / desconectar sem escrita. **Não** exigem o gateway no ar.

Homologação humana do QR usa **número de teste** (cerca de 7 dias), não o número pessoal do Felipe.

---

## 7. Fora de escopo

- Inbox, bot, conversa, DeskcommCRM.
- Multi-número / segunda sessão.
- Painel do gateway para a equipe; quadro embutido do endereço do gateway.
- Reusar a tela de scan de estoque, a Hoje como tela do QR, ou criar tela de configurações.
- Relógio novo, manifesto de publicação, crontab, SSH, instalar ou reconfigurar o gateway na máquina.
- Escrita para dentista, auxiliar ou visualizador.
- Fluxo de pareamento por chave de acesso do aparelho (além do vermelho).
- Número pessoal do Felipe (homologação: número de teste).
- Fechar a Fase 7 inteira.
- Mudar o contrato de disparo (destino + texto).
- Playwright. Sobrescrever `.env` / `.env.local`.
- Homologação `manual-report` completa (fica no fechamento da Fase 7).

Ops manual (não é código desta spec; a fatia **não homologa** sem isso): no gateway, o aviso de mudança de sessão da sessão `default` aponta para o aplicativo publicado, com o mesmo segredo do aviso configurado na hospedagem.

---

## 8. Caminhos felizes

### 8.1 Caminho feliz · Recepção pareia do zero

1. Status persistido da sessão `default` está `STOPPED`.
2. Recepção autentica e abre a tela WhatsApp (pelo menu desktop ou pelo card na Hoje).
3. O aplicativo inicia a sessão.
4. O gateway pede QR; o status passa a `SCAN_QR` (via aviso).
5. A tela mostra o QR e o atualiza a cada 3 a 5 segundos.
6. A recepção lê o código no celular da clínica.
7. O status passa a `WORKING`. O QR some. A atualização periódica para. O chip fica verde estável. O card na Hoje fica verde.

**Pronto quando este fluxo passa** (homologação com número de teste e aviso do gateway configurado; em teste automatizado, iniciar + recusa sem escrita + mapa `SCAN_QR_CODE` → `SCAN_QR` bastam).

### 8.2 Caminho feliz · Admin desconecta e reconecta

1. Sessão em `WORKING`.
2. Admin abre a tela, confirma **Desconectar**.
3. Status deixa de ser `WORKING`. Chip e card ficam vermelhos piscando.
4. Disparos param até novo pareamento.
5. Admin (ou recepção) abre de novo a tela: se estiver `STOPPED`, inicia; se `SCAN_QR`, vê o QR. Volta ao §8.1.

### 8.3 Caminho feliz · Dentista só observa

1. Dentista abre a Hoje.
2. Vê o card com verde ou vermelho, **sem** link para a tela.
3. Lê que deve pedir à recepção ou ao admin.
4. Tentar o endereço da tela de pareamento: acesso negado. QR e desconectar recusados no servidor.

### 8.4 Caminho feliz · Auxiliar e visualizador

1. Auxiliar e visualizador **não** veem item WhatsApp, chip, card nem a tela.
2. Tentar o endereço: acesso negado.
3. Barra inferior do celular do auxiliar continua sem item extra (scan continua pelo atalho de estoque / Hoje, como hoje).

### 8.5 Caminho feliz · Menu e Hoje leem o persistido

1. Admin navega Agenda → Hoje → tela WhatsApp.
2. Chip e card mostram o último status gravado, **sem** o menu perguntar ao gateway.
3. Depois de um aviso `WORKING`, a próxima abertura dessas superfícies mostra verde.

### 8.6 Caminho feliz · Aviso recusado não grava

1. Chega um aviso sem assinatura válida, ou que não é mudança de sessão.
2. O status persistido **não** muda.
3. Chip e card continuam com o valor anterior.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Status `STOPPED` e papel com escrita abre a tela | Inicia a sessão `default` | §4.4 / §8.1 |
| Status `SCAN_QR` | Mostra QR; atualiza 3 a 5 s; para ao sair desse status | §4.4 |
| Status `WORKING` | Sem QR; sem atualização periódica; permite desconectar | §4.4 |
| Falha ou exigência de chave de acesso do aparelho | Vermelho; sem tela extra | §4.2 |
| Linha persistida ausente | Não quebra; trata como não em operação | §4.2 / §6.6 |
| Dentista abre a tela ou pede QR | Acesso negado / recusa no servidor | §4.6 / §8.3 |
| Auxiliar ou visualizador | Sem superfície; recusa no servidor | §8.4 |
| Recepção sem escrita nas ações (só item visível) | Proibido: recepção tem a **mesma** escrita que admin | §4.6 decisão |
| Clique em Desconectar sem confirmar | Não desconecta | §4.4 |
| Desconectar no meio do expediente | Todos os disparos param | Copy do diálogo §6.5 |
| Aviso com assinatura errada | Recusa; status velho | §4.3 / §8.6 |
| Aviso de outro tipo (mensagem recebida, etc.) | Ignora; não grava | §4.3 |
| Chip “atrasado” depois do pareamento | Aceito: muda no aviso + render ou na próxima navegação | §4.5 |
| QR que o gateway troca | Próxima atualização de 3 a 5 s pega a imagem nova; sem cache público | §4.4 |
| Canal / gateway indisponível ao iniciar ou pedir QR | Mensagem genérica; sem vazar chave nem detalhe interno | §6.5 |
| Túnel ou bloqueio de rede entre o aplicativo publicado e o gateway | Iniciar e QR falham igual o disparo de hoje | Fora do código; sem quadro embutido §7 |
| Clique duplo em iniciar | Um início; não dispara rajada | Servidor idempotente o suficiente para não criar segunda sessão |
| Segredo do aviso igual ao do relógio dos jobs | Proibido | §6.4 |
| Chave do gateway no navegador | Proibido | §4.1 / §5 |
| Barra inferior com sexto item | Proibido | §4.5 |
| QR embutido na Hoje | Proibido | §4.5 |
| Travessão em copy nova | Proibido | §6.5 |
| Mudar destino + texto do disparo | Proibido | §4.1 / §7 |
| Fechar a Fase 7 de quebra | Proibido | §7 |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho §8.1: recepção (e admin) inicia se parado, vê QR só em `SCAN_QR`, atualiza 3 a 5 s só nesse estado, some o QR em `WORKING`.
- [ ] Caminho §8.2: desconectar exige confirmação; copy avisa que os disparos param; dá para parear de novo.
- [ ] Caminho §8.3: dentista só o card na Hoje, sem link; tela e QR recusados.
- [ ] Caminho §8.4: auxiliar e visualizador sem item, chip, card e tela.
- [ ] Caminho §8.5: menu e Hoje leem o persistido; **não** perguntam ao gateway na montagem.
- [ ] Caminho §8.6: aviso sem assinatura válida ou de outro tipo não grava.
- [ ] Mapa de domínio: `SCAN_QR_CODE` do gateway → `SCAN_QR`; falha e chave de acesso do aparelho → não `WORKING`, sem UI extra (Vitest).
- [ ] Matriz §4.6: admin e recepção com **escrita**; dentista, auxiliar e visualizador com **nenhum** (Vitest). O teste do admin **deixa de** esperar 6 módulos.
- [ ] Barra inferior: continua **5** itens; WhatsApp **fora** dela, como o scan de estoque (Vitest do menu).
- [ ] Iniciar, QR e desconectar recusados no servidor sem escrita (Vitest de borda, sem gateway real obrigatório).
- [ ] Assinatura do aviso coberta em regra de domínio (Vitest). Segredo **diferente** do relógio dos jobs.
- [ ] Leitura do persistido para admin, dentista e recepção; escrita autenticada **negada**; gravação só pelo caminho privilegiado do aviso (caso de política coberto no teste de políticas).
- [ ] Seed da sessão `default` em `STOPPED`.
- [ ] Contrato de disparo (destino + texto) **intacto**. Só reutilizar a leitura da config do canal.
- [ ] Variável do segredo do aviso documentada no exemplo de ambiente, **vazia**.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, chave só no servidor, aviso autenticado por segredo, PHI fora de log (aviso de sessão **não** carrega paciente).
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] Trio vivo após o código: registro da fatia, capítulo de manual-dev, `PENDENCIAS.md` com a fatia em implementação e homologação do QR / aviso do gateway na seção operacional. **Não** marcar a Fase 7 como fechada.
- [ ] Índices de implementação e de manual-dev atualizados **sem** declarar a Fase 7 concluída.
- [ ] Nenhum arquivo fora do escopo §11.

### Qualidade

- [ ] Alvos de toque ≥ 44 px no QR / desconectar / atalho da Hoje.
- [ ] Chip: verde estável vs vermelho **piscando** (não os dois estáticos iguais).
- [ ] Desconectar é destrutivo o suficiente para exigir diálogo, não um toque único.
- [ ] Regressão: disparo pós-cirurgia, convite e oferta da fila **não** mudam de contrato; scan de estoque e dock de 5 itens intactos.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone / Android reais (fechamento da Fase 7), salvo o caminho §8.1 com número de teste quando o aviso do gateway estiver no ar.
- Configurar o aviso **dentro** do gateway (ops; bloqueia homologação, não o merge do código).
- Pareamento por chave de acesso do aparelho.
- Fechamento da Fase 7.
- Cobertura 80% global do repositório (domínio e bordas tocados).
- Playwright.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

Linguagem de domínio nas seções 1 a 10. Paths, migration e variáveis aparecem **só** aqui (e na configuração §6.4).

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-29-tela-qr-whatsapp.md` | Esta spec |
| `supabase/migrations/027_whatsapp_session_status.sql` | Uma linha por sessão (`session_name` PK, valor `default`); `status`; `updated_at`; leitura para admin, dentist, reception; sem escrita `authenticated`; escrita só privilegiada; seed `default` + `STOPPED` |
| `src/features/whatsapp/domain/session-status.ts` | Mapa de status do gateway → domínio (`SCAN_QR`); balde não `WORKING` |
| `src/features/whatsapp/domain/session-status.test.ts` | Vitest do mapa |
| `src/features/whatsapp/domain/webhook-hmac.ts` | Verificar assinatura do aviso (sha512 do corpo) |
| `src/features/whatsapp/domain/webhook-hmac.test.ts` | Vitest da assinatura |
| `src/features/whatsapp/lib/waha-session.ts` | Server-only: iniciar, desconectar, obter QR; mesma chave do canal; fetch injetável |
| `src/features/whatsapp/lib/waha-session.test.ts` | Iniciar / desconectar / QR; sem rede real obrigatória |
| `src/features/whatsapp/lib/persist-session-status.ts` | Upsert privilegiado do status |
| `src/features/whatsapp/permissions.ts` | Escrita = admin e reception |
| `src/features/whatsapp/queries.ts` | Ler a linha `default` |
| `src/features/whatsapp/actions.ts` | Iniciar e desconectar; recusa sem escrita |
| `src/features/whatsapp/components/whatsapp-session-panel.tsx` | Painel da tela: QR, poll 3–5 s só em `SCAN_QR`, desconectar com confirmação |
| `src/features/whatsapp/components/whatsapp-status-card.tsx` | Card da Hoje (com ou sem atalho) |
| `src/app/(app)/whatsapp/page.tsx` | Tela de pareamento |
| `src/app/api/whatsapp/qr/route.ts` | Entrega do QR autenticada (sessão + escrita); `Cache-Control: no-store` |
| `src/app/api/webhooks/waha/route.ts` | Aviso de `session.status`; HMAC `X-Webhook-Hmac`; upsert; revalidar tela WhatsApp, Hoje e layout. **Não** é job de relógio |
| `docs/implementation/F7-10-tela-qr-whatsapp.md` | Registro da fatia (no fechamento do código) |
| `docs/manual-dev/19-fase-7-10-tela-qr-whatsapp.md` | Como operar a tela e o aviso no gateway |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/lib/auth/roles.ts` | Módulo `whatsapp`; prefixo `/whatsapp`; `AUTHENTICATED_ROUTE_PREFIXES`; admin e reception `write`; dentist / room_assistant / viewer `none` |
| `src/lib/auth/roles.test.ts` | Reception `write`; dentist `none`; admin **não** espera mais 6 módulos |
| `src/lib/auth/guard.ts` | Rótulo do módulo na tela de acesso negado |
| `src/types/clinroma.ts` | Entrada em `CLINROMA_MODULES` |
| `src/components/app-shell.tsx` | Item desktop; chip no `EnvChips` (prop serializável do status); `getMobileNavModules` exclui `whatsapp` |
| `src/components/app-shell.test.ts` | Dock continua 5 itens; WhatsApp fora da barra |
| `src/app/(app)/layout.tsx` | Ler a linha persistida; **não** consultar o gateway; passar prop ao `AppShell` |
| `src/app/(app)/hoje/page.tsx` | Card para admin, reception e dentist; link só com o módulo |
| `src/lib/supabase/database.types.ts` | Regenerar após a migration `027` |
| `src/lib/auth/rls-policy.test.ts` | Caso da leitura / recusa de escrita autenticada |
| `.env.example` | `WHATSAPP_WEBHOOK_SECRET` vazio |
| `docs/SECURITY.md` | Superfície do aviso e da tela: HMAC, chave no servidor, sem PHI no log do aviso |
| `docs/implementation/README.md` | Link da fatia F7-10; Fase 7 **permanece aberta** |
| `docs/manual-dev/README.md` | Capítulo 19; Fase 7 **não** concluída |
| `docs/state/PENDENCIAS.md` | Fatia em implementação; homologação do QR e do aviso na seção operacional |

### Permitido com restrição

| Arquivo | Restrição |
| ------- | --------- |
| `src/lib/whatsapp/send-whatsapp.ts` | **Só** reutilizar `readWhatsAppChannelConfig`. **Não** mudar a interface `destino` + `texto` nem o comportamento de disparo |
| `.cursor/rules/architecture.mdc` | **Só** se for preciso citar `src/features/whatsapp/` na árvore. Sem reabrir fases |

### Proibido alterar nesta feature

- Contrato e testes de `sendWhatsApp` além do reuso da config.
- Jobs do relógio, manifesto de publicação, crontab, SSH, pasta do gateway na VPS.
- Scan de estoque, `/estoque/scan`, `home-hero` (o atalho desta fatia é o **card**, não o hero do scan).
- Prontuário, agenda, tokens da fila, anamnese pública.
- `supabase/migrations/001` a `026`.
- Conteúdo extra em `027` além do status da sessão.
- `.env`, `.env.local`, segredos reais, número da clínica.
- Specs históricas em `specs/` além desta.
- `docs/plans/plano-tela-qr-whatsapp.md` (já aprovado; não reabrir).
- Fechamento da Fase 7 nos índices.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Recepção tem a **mesma escrita** que admin: QR, iniciar e desconectar |
| 2 | Card do dentista na Hoje **não** leva à tela de pareamento |
| 3 | Abrir a tela com escrita e status `STOPPED` **inicia** sozinho a sessão `default` |
| 4 | Aviso autenticado por HMAC sha512 (`X-Webhook-Hmac`) e env `WHATSAPP_WEBHOOK_SECRET` (não o segredo do relógio) |
| 5 | Feature nova em `src/features/whatsapp/`; não misturar com estoque nem com `records` |
| 6 | Uma sessão: `default`. Sem multi-número |
| 7 | Menu e Hoje leem o **persistido**; o menu **não** consulta o gateway |
| 8 | Atualização periódica **só** na tela e **só** em `SCAN_QR` (3 a 5 s) |
| 9 | `SCAN_QR_CODE` → `SCAN_QR`. Falha e chave de acesso do aparelho → vermelho, sem UI extra |
| 10 | Barra inferior **sem** sexto item |
| 11 | QR **não** entra na Hoje |
| 12 | Contrato de disparo **intacto** |
| 13 | Ops do aviso no gateway é homologação, não código |
| 14 | Esta fatia **não** fecha a Fase 7 |
| 15 | Migration incremental `027`; não editar `001`–`026` |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Chip atrasado depois do pareamento | Aceito §4.5; poll só em `SCAN_QR` |
| Aviso falha ou segredo errado | Status velho; disparos quebram em silêncio. Segredo próprio; homologar o evento `WORKING` com número de teste |
| QR que gira | Poll 3 a 5 s + imagem sem cache público |
| Logout no meio do dia | Só escrita + confirmação; copy explícita §6.5. Recepção opera o pareamento; o risco de desligar sobe e fica visível |
| Regressão no menu / papéis | Path de toda página autenticada. Testes: matriz, dock de 5, recepção com escrita nas ações e no QR, dentista sem cair na tela pelo card |
| Rede entre o app publicado e o gateway | Fora do código; não “consertar” com quadro embutido |
| Linha `default` ausente | Seed na migration; fallback visual vermelho sem quebrar |
| Inflar para inbox ou segundo número | Fora §7 |

Paths críticos de runtime: matriz e guarda de rotas; shell de todas as páginas autenticadas; Hoje; nova superfície pública autenticada por segredo (aviso); canal operacional (desconectar / QR afetam os disparos), **sem** editar o corpo do disparo.

Não toca: conflito de agenda, tokens da fila, anamnese pública, scan de insumo, jobs do relógio.

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-tela-qr-whatsapp.md`
- Spec de disparo: `specs/2026-08-28-f7-04-05-whatsapp-pos-cirurgia.md` (QR ficava fora; agora entra nesta fatia)
- Spec F7-05b: `specs/2026-08-28-f7-05b-agendamento-pos-cirurgia.md`
- Oferta da fila: `docs/implementation/F4-fila-oferta-whatsapp.md`
- `docs/SECURITY.md` · PHI, fail secure, avisos com assinatura
- `docs/state/PENDENCIAS.md`
- `AGENTS.md` · ClinRoma dispara; inbox fora deste repo
- Vault: decisão `2026-08-29-tela-qr-whatsapp`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente** o escopo §11, na branch descritiva da fatia (ex.: `feature/tela-qr-whatsapp`). Sem inbox, sem segundo número, sem fechar a Fase 7, sem mexer no contrato de disparo.

Não implementar código enquanto esta spec estiver em **draft** sem o seu sim.
