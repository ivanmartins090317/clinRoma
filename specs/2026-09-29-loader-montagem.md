# Spec · Loader da marca e montagem da Hoje

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-09-29                                                            |
| **Slug**         | loader-montagem                                                       |
| **Plano origem** | `docs/plans/plano-loader-montagem.md` (aprovado no chat em 2026-09-29) |
| **Fase**         | Fatia de espera nas telas autenticadas. **Não** reabre nem fecha fase do plano do produto. |
| **Autonomia**    | medium                                                                |

---

## 1. Contexto

Depois do login, e ao trocar de módulo, o miolo das telas autenticadas fica em branco até a Hoje (e as outras páginas) terem reunido tudo o que vão mostrar. O menu espera, junto com o miolo, a lista de dentistas ativos e o estado do WhatsApp da clínica.

A marca da Neo Roma entra como espera. A Hoje deixa de aparecer inteira de uma vez e passa a montar os blocos conforme cada um fica pronto. O que a clínica guarda não muda.

---

## 2. Objetivo

1. Com a pessoa já reconhecida, o menu aparece e o símbolo dourado fica no centro do miolo enquanto a próxima tela ainda não devolveu o conteúdo.
2. Na Hoje, a saudação pode sair com o menu. Os demais blocos entram um a um, no lugar já reservado, quando o dado daquele bloco chega.
3. Ao trocar de página, o menu permanece. O mesmo símbolo ocupa só o miolo até a tela nova estar pronta.
4. Quem pede menos movimento no sistema vê o símbolo parado e os blocos sem deslocamento.

**Valor entregue:** a espera deixa de ser tela branca. A pessoa vê a marca e, na Hoje, o dia se montando.

---

## 3. Atores

Quem já entra no sistema. O paciente, no link público, não vê este loader.

| Ator | Interesse |
| ---- | --------- |
| Administrador | Hoje completa, inclusive falhas de lembrete e card de WhatsApp |
| Recepção | Hoje, card de WhatsApp, chip de WhatsApp no menu |
| Dentista | Hoje e card de WhatsApp. Sem chip de WhatsApp no menu |
| Visualizador | Hoje sem card de WhatsApp e sem falhas de lembrete |
| Auxiliar de sala | Não entra na Hoje. Vê o símbolo só ao abrir Estoque ou o scan |

---

## 4. Modelo de domínio

### 4.1 Dois momentos

**Entrada e troca de página.** O símbolo da Neo Roma fica no centro da área de conteúdo. A sidebar (tela larga) ou a dock (celular) continua visível e clicável. O nome da pessoa e os módulos do papel já estão no menu.

**Montagem da Hoje.** O símbolo sai quando a Hoje devolve a saudação e os lugares reservados. Cada bloco entra com o mesmo movimento, na ordem em que o dado daquele bloco fica pronto. Vários no mesmo instante entram com um pequeno atraso entre eles, de cima para baixo na página.

### 4.2 O que o símbolo é

- A marca dourada já usada como ícone do app (`public/brand/icon-192.png`), fundo transparente, para não pixelizar ao crescer.
- O wordmark claro da sidebar continua só no menu. O favicon pequeno da aba não entra no miolo.
- Fundo creme da página. Sem cartão em volta do símbolo. Sem frase além do texto alternativo **Carregando**.

### 4.3 Movimento

| O que | Como |
| ---- | ---- |
| Tamanho na tela | cerca de 72 px |
| Giro | uma volta em 2,6 s, contínuo, velocidade constante |
| Crescimento | de 0,82 para 1 em 1,1 s, uma vez, e para. Não pulsa |
| Aparição | invisível nos primeiros 150 ms. Página que responde antes disso não pisca o símbolo |
| Entrada do bloco | opacidade de 0 para 1, sobe 8 px, cerca de 280 ms |
| Vários blocos juntos | atraso de 50 ms entre eles, na ordem visual (0, 50, 100, 150) |

### 4.4 Menos movimento

Com `prefers-reduced-motion: reduce`: sem giro, sem crescimento e sem subida. O símbolo aparece parado, no tamanho final. Os blocos aparecem no lugar. O atraso de 150 ms da aparição do símbolo permanece, para a página rápida não piscar.

### 4.5 O que não se guarda

Consulta, fila, estoque e lembrete não ficam guardados de uma visita para outra. Sessão, dentistas ativos e estado do WhatsApp podem ser lidos uma vez só na mesma abertura de página, porque o menu e a Hoje pedem a mesma coisa.

---

## 5. Matriz de acesso

O que cada papel pode ver não muda. Esta fatia só muda a espera.

| Bloco da Hoje | Admin | Recepção | Dentista | Visualizador | Auxiliar |
| ------------- | :---: | :------: | :------: | :----------: | :------: |
| Saudação | Sim | Sim | Sim | Sim | Não entra na Hoje |
| Números do dia | Sim | Sim | Sim | Sim | |
| WhatsApp da clínica | Sim | Sim | Sim | Não | |
| Consultas de hoje | Sim | Sim | Sim | Sim | |
| Falhas de lembrete | Sim | Não | Não | Não | |
| Fila aguardando | Sim | Sim | Sim | Sim | |
| Estoque abaixo do mínimo | Sim | Sim | Sim | Sim | |

Atalhos dentro da saudação (nova consulta, scan) continuam os de hoje, conforme o papel.

No menu, o chip **WhatsApp ligado / desligado** continua só para administrador e recepção. A contagem de dentistas ativos continua para quem vê o menu. Os dois aparecem quando a leitura volta. Não seguram o restante do menu e não mostram zero provisório.

---

## 6. Escopo funcional

### 6.1 Loader no miolo

Em toda tela autenticada (Hoje, Agenda, Pacientes, Fila, Estoque, scan, WhatsApp, Equipe, acesso negado), enquanto o miolo da próxima página não chegou:

- o menu permanece;
- o símbolo ocupa o centro do miolo;
- um toque no menu troca de módulo na hora. O símbolo da troca nova substitui o anterior.

### 6.2 Menu antes do miolo

A entrada no sistema continua exigindo sessão válida e permissão da rota **antes** de mostrar o menu. Sem isso, não há shell.

Dentistas ativos e o estado do WhatsApp deixam de segurar essa primeira pintura. O menu dos módulos do papel aparece com a sessão. Chip de WhatsApp e contagem de dentistas entram depois, no mesmo lugar.

### 6.3 Hoje por bloco

A Hoje deixa de esperar todos os dados para desenhar a página. A ordem visual permanece:

1. Saudação (sessão já resolvida, sem leitura extra).
2. Números: consultas hoje, na fila, ofertas expirando, estoque crítico.
3. WhatsApp da clínica, só para quem já vê o card.
4. Consultas de hoje, com o lembrete de cada consulta no mesmo bloco.
5. Falhas de lembrete, só administrador.
6. Fila aguardando.
7. Estoque abaixo do mínimo.

Quem não vê um bloco não ganha lugar vazio no lugar dele.

Lugar reservado, enquanto o bloco não chegou: a altura próxima do bloco real, com a borda e o fundo já usados na Hoje. Sem segundo símbolo. Sem brilho correndo.

Texto, links e vazios de cada bloco permanecem os de hoje. Lista vazia não é erro.

Consultas e lembretes continuam juntos: o lembrete depende das consultas daquele bloco. Não vira bloco solto.

### 6.4 Fora do shell

Login, esqueci a senha, definir senha, redefinir senha, link do paciente na fila e convite de anamnese não ganham este símbolo.

---

## 7. Fora de escopo

- Guardar dado clínico entre visitas, índice novo ou leitura mais curta no banco.
- Símbolo em tela cheia por cima do menu.
- Animar o login antes do redirecionamento.
- Montar Agenda, Fila, prontuário ou Estoque bloco a bloco.
- Barra de progresso no topo.
- Trocar wordmark, paleta ou favicon da aba.
- Fechar fase do plano do produto.
- Capítulo novo de manual. O conteúdo da Hoje não muda.

---

## 8. Caminhos felizes

### 8.1 Admin entra e a Hoje monta

1. Entra com o perfil de administrador.
2. O menu aparece. O símbolo dourado está no miolo, gira devagar e cresce uma vez até o tamanho final.
3. A saudação entra. O símbolo sai. Os lugares dos outros blocos já estão na página.
4. Números, WhatsApp, consultas, falhas de lembrete, fila e estoque entram conforme cada um fica pronto, sem salto grande de layout.

### 8.2 Troca de página

1. Na Hoje, abre a Fila.
2. O menu não remonta. O símbolo ocupa só o conteúdo até a Fila estar pronta.
3. Volta para a Hoje. O mesmo símbolo, de novo só no miolo, até a Hoje devolver saudação e lugares.

### 8.3 Recarregar a Hoje pela URL

1. Com a sessão válida, abre a Hoje direto.
2. O menu aparece na mesma espera. Não há tela branca longa antes do menu.

### 8.4 Celular

1. Viewport estreito: a dock continua na base.
2. O símbolo fica centralizado na área acima da dock, sem cobrir a barra.

### 8.5 Menos movimento

1. O sistema pede menos movimento.
2. O símbolo fica parado, no tamanho final.
3. Os blocos da Hoje entram sem subir.

---

## 9. Erros e bordas

| Situação | Comportamento |
| -------- | ------------- |
| Sessão ausente ou rota proibida | Continua o fluxo de hoje: login ou acesso negado. Sem menu falso por baixo do símbolo |
| Página pronta em menos de 150 ms | O símbolo não pisca |
| Vários blocos prontos no mesmo instante | Entram de cima para baixo, 50 ms entre um e o seguinte |
| Visualizador na Hoje | Sem card de WhatsApp e sem falhas de lembrete. O símbolo da troca de página é o mesmo |
| Auxiliar depois do login | Cai em Estoque, como hoje. Vê o símbolo no miolo. Não vê blocos da Hoje |
| Dentista | Vê o card de WhatsApp na Hoje. Não vê o chip de WhatsApp no menu |
| Contagem de dentistas ou chip ainda não voltou | O menu já está usável. O chip entra quando o dado chega, sem mostrar zero provisório |
| Um bloco da Hoje não carrega | O menu e os blocos que já chegaram permanecem. O lugar daquele bloco mostra **Não foi possível carregar agora.** Sem segundo símbolo |
| Lista vazia (nenhuma consulta, fila vazia, estoque ok) | O bloco aparece com o texto vazio de hoje |
| Lembrete de uma consulta | Continua dentro do bloco de consultas, depois que as consultas daquele bloco existem |
| Link público, senha ou anamnese | Sem este símbolo |

---

## 10. Critérios de Done

- [ ] Depois do login, o menu está visível e o símbolo dourado ocupa o miolo enquanto a Hoje ainda não devolveu a saudação e os lugares.
- [ ] Os blocos da Hoje entram no lugar reservado, sem segundo símbolo e sem salto grande.
- [ ] Troca de página: o menu não remonta. O símbolo fica só no conteúdo.
- [ ] Celular: símbolo acima da dock, sem cobrir a barra.
- [ ] `prefers-reduced-motion: reduce`: símbolo parado, blocos sem subida.
- [ ] Papel sem card de WhatsApp (visualizador) não ganha esse bloco. Auxiliar continua sem Hoje.
- [ ] Consulta, fila, estoque e lembrete não ficam guardados entre visitas.
- [ ] Sessão, dentistas ativos e estado do WhatsApp não são lidos duas vezes na mesma abertura de página.
- [ ] Copy pt-BR, sem travessão. Texto alternativo do símbolo: **Carregando**.
- [ ] Nenhum arquivo fora do §11.
- [ ] `npm run lint` nos arquivos tocados, `npm run build` e `npm run test` passam.
- [ ] Verificação no navegador dos caminhos §8, registrada nesta fatia. Sem capítulo novo de manual e sem fechar fase.

Não exigido: teste automatizado de animação. A evidência desta fatia é o navegador.

---

## 11. Escopo de arquivos permitidos

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `src/components/layout/page-loader.tsx` | Símbolo no miolo |
| `src/app/(app)/loading.tsx` | Espera de toda tela autenticada, dentro do menu |
| `src/components/layout/menu-chips-ao-vivo.tsx` | Contagem de dentistas e chip de WhatsApp, depois do menu |
| `src/app/(app)/hoje/lugar-reservado.tsx` | Lugar do bloco e aviso de falha daquele bloco |
| `src/app/(app)/hoje/numeros-do-dia.tsx` | Quatro números |
| `src/app/(app)/hoje/whatsapp-do-dia.tsx` | Card de WhatsApp, se o papel já vê |
| `src/app/(app)/hoje/consultas-do-dia.tsx` | Consultas e lembretes daqueles horários |
| `src/app/(app)/hoje/falhas-de-lembrete.tsx` | Só administrador |
| `src/app/(app)/hoje/fila-aguardando.tsx` | Resumo da fila |
| `src/app/(app)/hoje/estoque-abaixo-do-minimo.tsx` | Alertas de estoque |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/app/(app)/layout.tsx` | Guarda de sessão antes do menu. Dentistas e WhatsApp deixam de segurar o miolo |
| `src/components/app-shell.tsx` | Menu usável sem a contagem e sem o chip. Os dois entram no lugar |
| `src/components/app-shell.test.ts` | Só se o contrato do menu mudar e o teste atual quebrar |
| `src/app/(app)/hoje/page.tsx` | Saudação e lugares. Sem esperar todos os dados antes de desenhar |
| `src/app/globals.css` | Giro, crescimento, entrada do bloco e menos movimento |
| `src/lib/auth/session.ts` | Uma leitura de sessão por abertura de página |
| `src/features/agenda/queries.ts` | Uma leitura de dentistas ativos por abertura de página |
| `src/features/whatsapp/queries.ts` | Uma leitura do estado do WhatsApp por abertura de página |

### Proibido nesta feature

- Migration, `.env`, `.env.example`.
- Guardar dado clínico entre visitas.
- Animar login, senha, link da fila ou anamnese.
- Fatiar Agenda, Fila, prontuário ou Estoque em blocos.
- Barra de progresso, loader em tela cheia, asset novo de marca.
- `docs/PLANO.md`, manuais e specs de outras fatias.

**Branch sugerida (após aprovação):** `feature/loader-montagem`.

---

## 12. Decisões fechadas

| # | Decisão |
| - | ------- |
| 1 | O símbolo do miolo é `public/brand/icon-192.png`. O wordmark fica na sidebar |
| 2 | O loader não cobre o menu. Sem sessão válida não há menu |
| 3 | A Hoje é a única tela com blocos independentes nesta fatia |
| 4 | O símbolo sai quando a Hoje devolve a saudação e os lugares, não quando o último dado chega |
| 5 | Atraso de 50 ms segue a ordem visual da página, entre os blocos que chegaram juntos |
| 6 | Falha de um bloco não apaga os outros. O aviso é **Não foi possível carregar agora.** |
| 7 | Sem cache de dado clínico entre visitas. Sessão, dentistas e WhatsApp repetem no máximo uma vez na mesma abertura |
| 8 | Menos movimento desliga giro, crescimento e subida. O símbolo fica parado |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| A guarda de sessão continuar esperando dentistas e WhatsApp | O menu só espera sessão e permissão da rota. Contagem e chip vêm depois (§6.2) |
| A Hoje responder tão rápido que o símbolo quase não aparece | Os lugares reservados seguram o layout. O movimento de entrada dos blocos é a montagem. Os 150 ms evitam piscar |
| Chip de dentistas piscar zero | O chip só entra com o número real |
| Um bloco com falha derrubar a página inteira | O aviso fica no lugar daquele bloco (§9) |
| Escopo ir para as outras telas em blocos | Fora de escopo §7. Elas só ganham o símbolo na troca |

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-loader-montagem.md`
- Papéis: `docs/manual-usuario/02-perfis-de-acesso.md`
- Marca: `public/brand/README.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

A implementação começa somente depois da aprovação explícita desta spec no chat. A branch sugerida é `feature/loader-montagem`.
