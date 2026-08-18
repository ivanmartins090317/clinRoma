# Plano Geral — ClinRoma

> Versão 1.0 · Piloto: Clínica Neo Roma
> Escopo base: `AGENTS.md` · Segurança: `docs/SECURITY.md`

## 1. Decisões fechadas

| Tema                  | Decisão                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| Tenancy               | Single-tenant. Sem `clinic_id`; RLS por sessão e papel                   |
| Agenda                | Biblioteca de calendário pronta, isolada atrás de um componente próprio  |
| Áudio da evolução     | Grava, armazena e transcreve com Whisper no v1                           |
| Insumos               | Upload da foto da planilha + digitação manual. Sem OCR                   |
| Lembrete pós-consulta | E-mail via Resend. WhatsApp fica para depois                             |
| Ordem de entrega      | Agenda primeiro, depois prontuário, fila e estoque                       |
| Responsividade        | Mobile-first. Celular é o dispositivo primário do dentista e da auxiliar |

### Biblioteca de calendário

Escolha: **react-big-calendar** (MIT, React 19 desde a 1.19.3).

Motivo: a agenda precisa de coluna por dentista e de arrastar para remarcar. No
Schedule-X v4 esses três recursos (resource view, drag-and-drop e resize) são
pagos, entre 479 EUR/ano e 999 EUR vitalício. No react-big-calendar a prop
`resources` e o addon de drag-and-drop são gratuitos.

Mitigação do risco de lock-in: todo o calendário fica atrás de
`src/features/agenda/components/agenda-calendar.tsx`, recebendo um tipo de
evento próprio do domínio. Trocar de biblioteca depois é reescrever um arquivo,
não a feature.

## 2. Estado atual do repositório

O que existe: scaffold Next.js 16 com React 19, Tailwind 4 com tokens da marca
Neo Roma, `AppShell` com sidebar, as seis rotas do menu e a página pública da
fila. Clients Supabase escritos em `src/lib/supabase/`.

O que não existe: nenhuma tabela, nenhuma migration, nenhum tipo gerado, nenhum
login, nenhum middleware de sessão, nenhuma chamada ao Supabase em qualquer
página, a pasta `src/features/`, shadcn/ui e testes.

As telas de agenda, pacientes e estoque são placeholders. A fila é um Kanban
estático com colunas hardcoded. A página `/fila/resposta/[token]` tem os botões
desabilitados.

## 3. Arquitetura alvo

```
src/
  app/
    (app)/            rotas autenticadas
    (auth)/login/     autenticação
    fila/resposta/    link público do paciente
    api/              webhooks e jobs
  features/
    agenda/           components · actions · queries · schemas
    patients/
    records/
    stock/
    waitlist/
    reminders/
  components/ui/      shadcn
  lib/
    supabase/         client · server · admin
    auth/             sessão e guarda por papel
    audit/            escrita no audit_log
supabase/
  migrations/
```

Regras que valem para toda feature:

- Server Components por padrão. `use client` só onde há interação de navegador.
- Leitura de dados em `queries.ts` (Server Components). Escrita em `actions.ts`
  (Server Actions) com Zod na borda e revalidação de autorização server-side.
- RLS sempre ativa, mesmo com checagem na action. Defense in depth.
- Nenhum arquivo passa de 300 linhas.

## 4. Estratégia mobile

O celular não é uma versão reduzida do sistema. Para dois dos cinco módulos ele
é o dispositivo principal:

- O **dentista** grava o áudio da prescrição pelo celular, dentro do
  consultório, muitas vezes de luva e sem poder tocar em teclado.
- A **auxiliar** escaneia o QR dos insumos pelo celular, em pé na frente do
  armário.

A recepção segue no desktop para a agenda, e os dois mundos convivem no mesmo
código com Tailwind mobile-first.

### Restrições de navegador que já estão confirmadas

**Gravação de áudio.** `MediaRecorder` funciona no Safari do iPhone a partir do
iOS 14.5, mas até o iOS 18.3 grava só `audio/mp4` com AAC; do 18.4 em diante
também aceita `audio/webm;codecs=opus`. O Chrome no Android usa WebM/Opus. A
consequência é que o formato precisa ser escolhido em runtime com
`MediaRecorder.isTypeSupported()`, nunca fixado no código, e o backend precisa
aceitar os dois. O Whisper consome ambos.

Três limites do iOS que mudam a interface: a captura exige contexto seguro
(HTTPS ou localhost), precisa partir de um gesto do usuário como um toque, e o
iOS interrompe a gravação se o navegador vai para segundo plano. Por isso o
gravador salva em blocos durante a gravação, em vez de só no final, e avisa a
perda se o app for minimizado.

**Leitura de QR.** A `BarcodeDetector` nativa é rápida mas não está disponível
por padrão no Safari do iPhone. Não dá para depender dela. A tela de scan
detecta a API nativa e cai para um decodificador WebAssembly (`zxing-wasm`)
quando ela não existe, com a mesma interface nos dois caminhos. Câmera também
exige HTTPS.

**Impacto no ambiente de desenvolvimento.** Como microfone e câmera exigem
contexto seguro, testar no celular real via rede local não funciona em HTTP.
O `npm run dev` precisa subir com HTTPS para que dentista e auxiliar consigam
validar antes do deploy.

### Padrões de interface

- Alvos de toque com no mínimo 44 por 44 pixels nas ações de uso clínico.
- `font-size` de 16 pixels nos campos, para o iOS não dar zoom ao focar.
- Respeitar `safe-area-inset` por causa do notch e da barra de gestos.
- Ações primárias na metade inferior da tela, alcançáveis com o polegar.
- Estados de carregamento e erro visíveis sem hover, que não existe no toque.

### Navegação

Hoje o `AppShell` tem a sidebar como `hidden md:block` e nenhuma alternativa
para telas pequenas, ou seja, **no celular não existe navegação entre módulos**.
Isso é corrigido na Fase 0 com uma barra inferior de navegação no mobile,
mantendo a sidebar no desktop.

## 5. Modelo de dados

Uma migration por domínio, em `supabase/migrations/`.

**Identidade**
`profiles` (id ref `auth.users`, nome, papel, ativo) e `dentists` (perfil
opcional, CRO, cor na agenda, ativo). Dentista separado de perfil para permitir
agendar para quem ainda não tem login.

**Agenda**
`appointments` (paciente, dentista, início, fim, status, procedimento,
observação, criado por). Status reaproveita o tipo `AppointmentStatus` já
definido em `src/types/clinroma.ts`.

**Pacientes e prontuário**
`patients` (nome, nascimento, CPF, contato, consentimento LGPD).
`medical_records` (paciente, dentista, consulta, tipo anamnese ou evolução,
conteúdo em jsonb).
`tooth_findings` para o odontograma, um registro por dente e face, com condição
e responsável pela última alteração.
`record_attachments` (caminho no Storage, mime, tamanho, tipo foto ou áudio,
transcrição e status da transcrição).

**Estoque**
`supplies` (nome, unidade, quantidade atual, mínimo).
`supply_packages` (insumo, código do QR, quantidade, lote, validade, situação).
`supply_movements` (entrada, saída ou ajuste, quantidade, responsável).
`supply_sheets` para a foto da planilha enviada.

**Fila**
`waitlist_entries` (paciente, prioridade vermelho/amarelo/verde, motivo,
dentista preferido, situação).
`slot_offers` (entrada da fila, horário oferecido, dentista, hash do token,
expiração, situação).
`patient_slot_responses` (oferta, resposta, consentimento, timestamp, hash do
IP). Nunca o token em claro no banco, nunca IP em texto claro.

**Transversal**
`reminders` (consulta, dentista, canal, situação, enviado em, erro).
`audit_log` (ator, ação, entidade, id da entidade, momento, meta).

**Storage** (todos os buckets privados): `record-photos`, `record-audio`,
`supply-sheets`, `supply-labels`.

## 6. Fases

### Fase 0 · Fundação do repositório

1. Corrigir `.gitignore`: a regra `.env*` está ignorando o `.env.example`, que
   por isso nunca foi versionado. Adicionar `!.env.example` e commitar o arquivo.
2. Commitar todo o trabalho local atual, hoje fora do git, em branch própria.
3. Instalar e configurar shadcn/ui sobre os tokens Neo Roma já existentes.
4. Adicionar Prettier e alinhar com o ESLint.
5. Subir o Supabase CLI e criar `supabase/migrations/`.
6. Criar `middleware.ts` para refresh de sessão.
7. Remover o import órfão de `Image` em `app-shell.tsx`.
8. Adicionar navegação mobile ao `AppShell`: barra inferior nas telas pequenas,
   sidebar mantida a partir de `md`. Hoje não existe navegação no celular.
9. Habilitar HTTPS no `npm run dev` para permitir testar microfone e câmera em
   celular real na rede local.
10. Definir no `globals.css` os padrões de toque: alvo mínimo, `font-size` 16px
    nos campos e `safe-area-inset`.

Pronto quando: `npm run lint` e `npm run build` passam limpos, o repositório
clona e roda a partir do `.env.example`, e é possível navegar entre todos os
módulos em um iPhone real acessando o dev por HTTPS.

### Fase 1 · Dados, autenticação e papéis

1. Migrations de todos os domínios da seção 4, com RLS.
2. Políticas por papel: `admin`, `dentist`, `reception`, `room_assistant`,
   `viewer`.
3. Gerar `src/lib/supabase/database.types.ts`.
4. Tela `/login` com Supabase Auth e rate limit.
5. Guarda de rota por papel no layout de `(app)`.
6. Helper de audit log.
7. Seed de desenvolvimento com os 5 dentistas.

Pronto quando: um usuário real loga, é barrado nas rotas do papel errado, e
tentativas de leitura fora da política falham na RLS mesmo com token válido.

Esta fase não entrega tela nova além do login, mas destrava todos os módulos.

### Fase 2 · Agenda

1. `src/features/agenda/` com queries, actions e schemas.
2. Calendário com coluna por dentista, visões dia e semana.
3. Criar, editar, remarcar e cancelar consulta.
4. Arrastar para remarcar, com confirmação.
5. Bloqueio de conflito de horário por dentista, validado no banco.
6. Substituir a `/hoje` estática pelas consultas reais do dia.
7. Visão mobile da agenda: cinco colunas de dentista não cabem em tela de
   celular. No mobile a agenda vira lista do dia agrupada por dentista, com
   filtro de dentista, e a grade com colunas aparece a partir de `md`. A
   biblioteca de calendário só é carregada no desktop, via import dinâmico.

Pronto quando: a recepção marca, remarca e cancela uma consulta sem tocar em
planilha, e o dentista consegue ver a agenda do próprio dia pelo celular.

### Fase 3 · Pacientes e prontuário

1. Busca e cadastro de paciente com consentimento LGPD.
2. Anamnese em formulário versionado.
3. Odontograma interativo persistindo em `tooth_findings`.
4. Evolução com upload de foto e gravação de áudio em buckets privados. A foto
   usa a câmera traseira direto pelo campo de arquivo; o áudio usa
   `MediaRecorder` com formato escolhido em runtime.
5. Transcrição do áudio com Whisper, em fila assíncrona, com o texto anexado à
   evolução e status visível de processamento.
6. Audit log em leitura e escrita de prontuário.
7. Gravador desenhado para uso de consultório: botão grande de gravar acessível
   com o polegar, cronômetro e indicador de nível visíveis, upload em blocos
   durante a gravação para não perder áudio se o iOS mandar o navegador para
   segundo plano, e retomada do envio se a rede cair.
8. Odontograma com layout próprio no mobile, com zoom e seleção por toque, já
   que a arcada completa não é legível em tela pequena.

Pronto quando: o dentista abre o paciente pela agenda **no celular**, grava a
prescrição em áudio de ponta a ponta em um iPhone e em um Android, e a
transcrição aparece sem recarregar a página.

### Fase 4 · Fila Kanban

1. Substituir o demo estático por entradas reais com as três prioridades.
2. Arrastar entre colunas alterando situação, com sensores de toque além do
   mouse. No mobile as três colunas viram abas com rolagem, e mover a entrada
   também é possível por menu de ação, sem depender de arrastar.
3. Oferta de horário gerando token opaco com validade de 40 minutos.
4. Página pública com nome parcial, horário, checkbox de consentimento e os
   botões de aceitar e recusar funcionando. É aberta pelo paciente em celular
   quase sempre, então nasce mobile-first, leve e sem dependência pesada.
5. Aceite cria a consulta na agenda em transação.
6. Expiração automática da oferta.

Pronto quando: uma vaga aberta por cancelamento vira consulta confirmada pelo
link, sem a recepção ligar.

### Fase 5 · Insumos e estoque

1. Cadastro de insumo com estoque mínimo.
2. Upload da foto da planilha e digitação dos itens.
3. Geração de QR por pacote e folha de etiquetas para impressão.
4. Tela `/estoque/scan` lendo QR pela câmera, com `BarcodeDetector` nativa
   quando existir e `zxing-wasm` como alternativa no iPhone. Câmera traseira por
   padrão, botão de lanterna quando o aparelho suportar, e alvo de leitura
   recortado para acelerar a decodificação.
5. Baixa de retirada registrando responsável e horário.
6. Modo de leitura contínua: a auxiliar escaneia vários pacotes seguidos com
   confirmação sonora e tátil a cada leitura, sem voltar para uma lista entre
   um e outro.
7. Alerta de estoque abaixo do mínimo na `/hoje`.
8. Manifest e ícone para instalar na tela inicial do celular, deixando a tela de
   scan a um toque de distância.

Pronto quando: a auxiliar retira um pacote pelo celular, em iPhone e em
Android, e o saldo cai sozinho.

### Fase 6 · Lembrete e piloto

1. Lembrete pós-consulta por e-mail via Resend, com retry e registro em
   `reminders`.
2. Deploy na Vercel com projeto Supabase de produção separado do de dev.
3. Revisão do checklist de DoD do `docs/SECURITY.md` em todas as features.
4. Homologação manual completa com a skill
   `.cursor/skills/manual-report`: casos de teste, evidências (desktop e
   mobile), relatório HTML e log de bugs. **Último passo antes da entrega ao
   cliente.** Sem Playwright no MVP.
5. Acompanhamento da clínica em uso real e ajustes pós-entrega.

## 7. Qualidade

- Vitest para regras de domínio: conflito de horário na agenda, expiração de
  token da fila, cálculo de saldo de estoque.
- **Sem Playwright no MVP.** Fluxos de UI (login, agenda, prontuário, fila,
  scan, link público) entram na homologação manual da Fase 6 via skill
  `.cursor/skills/manual-report` (relatório HTML, evidências e bugs), antes da
  entrega ao cliente.
- Teste manual em aparelho real antes de fechar as Fases 3 e 5, em um iPhone e
  em um Android. Emulador não reproduz permissão de microfone, formato de
  gravação nem foco de câmera.
- Meta de 80% de cobertura nas camadas de domínio e actions.

## 8. Riscos

| Risco                                             | Mitigação                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| RLS mal escrita expondo PHI                       | Testes de política com usuário de cada papel na Fase 1               |
| Token da fila enumerável                          | Token aleatório, guardado só como hash, expira em 40 min             |
| Custo e latência do Whisper                       | Transcrição assíncrona, áudio sempre disponível mesmo se falhar      |
| Lock-in do calendário                             | Biblioteca isolada atrás de um componente do domínio                 |
| Escopo crescer para o WhatsApp                    | WhatsApp do paciente é do DeskcommCRM, repositório separado          |
| Formato de áudio incompatível entre iOS e Android | Formato escolhido em runtime; backend aceita mp4 e webm              |
| iOS cortar a gravação em segundo plano            | Upload em blocos durante a gravação e aviso claro ao dentista        |
| QR não ler no iPhone por falta da API nativa      | Detecção de recurso com alternativa em WebAssembly                   |
| Rede instável no consultório                      | Upload com retomada; áudio preservado localmente até confirmar envio |
