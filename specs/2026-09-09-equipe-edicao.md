# Spec · F7-11b · Edição da Equipe (dados + RBAC recepção)

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-09-09                                         |
| **Slug**         | equipe-edicao                                      |
| **Plano origem** | `docs/plans/plano-edicao-equipe.md`                |
| **Fase**         | 7 de `docs/PLANO.md` (fatia; **não** fecha a fase) |
| **Fatia pai**    | F7-11 · Gestão de acessos (`docs/implementation/F7-11-gestao-acessos.md`) |
| **Autonomia**    | medium                                             |
| **Modelo RBAC**  | B (recepção operacional)                           |

---

## 1. Contexto

A fatia F7-11 entregou o módulo **Equipe**: o administrador convida colaborador, troca papel, ativa ou desativa acesso e reenvia convite. Depois da criação, o **e-mail fica só leitura**; não há edição de nome de exibição nem da ficha de agenda do dentista (nome clínico, CRO, cor, ativo na agenda). Corrigir e-mail hoje exige o painel externo de autenticação.

Na homologação, o admin precisou corrigir o e-mail de um dentista sem sair do ClinRoma. Esta fatia fecha essa lacuna e libera a **recepção** no dia a dia operacional **sem** entregar o poder de controle de acesso (trocar papel, ativar/desativar, convidar admin).

**Pré-requisito:** F7-11 no código (lista, convite, papel, ativo, reenvio) e módulo Equipe já existente.

Esta spec cobre **somente F7-11b**. Não fecha a Fase 7. Não exclui colaborador de forma definitiva.

---

## 2. Objetivo

1. Admin e recepção abrem **Equipe**, listam colaboradores e **editam dados** (e-mail, nome de exibição e, quando houver vínculo, ficha de agenda do dentista).
2. Recepção **convida e reenvia convite** apenas para papéis não-admin.
3. Só o **admin** troca papel e ativa/desativa acesso; só o admin convida outro admin e edita contas com papel admin.
4. Ninguém troca o próprio papel nem o próprio ativo; editar o próprio e-mail e o próprio nome de exibição **é permitido**.

**Valor entregue:** correção de e-mail e dados do dentista no expediente, sem painel externo; recepção opera o cadastro da equipe sem promover ou desligar acessos.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Ver Equipe; editar qualquer colaborador; convidar qualquer papel (inclui admin); trocar papel; ativar/desativar acesso; reenviar convite |
| Recepção | Ver Equipe; editar dados de alvos **não-admin**; convidar e reenviar só papéis não-admin; **não** troca papel nem ativo; **não** edita conta admin |
| Dentista | Continua **sem** Equipe nesta fatia |
| Auxiliar de sala | Continua **sem** Equipe |
| Visualizador | Continua **sem** Equipe |
| Colaborador-alvo | Recebe e-mail de convite/reenvio; após troca de e-mail, passa a entrar com o e-mail novo |
| Paciente | Fora desta feature |

---

## 4. Modelo de domínio

### 4.1 Colaborador

Cada colaborador tem:

- **conta de login** (e-mail usado para entrar);
- **perfil** (nome de exibição, papel, ativo no sistema);
- opcionalmente uma **ficha de agenda** (dentista): nome clínico, CRO, cor na agenda, ativo na agenda.

Papéis do sistema: administrador, dentista, recepção, auxiliar de sala, visualizador.

### 4.2 Dados editáveis nesta fatia

| Dado | Significado |
| ---- | ----------- |
| E-mail de login | Identidade de entrada. Atualizar muda o e-mail da conta; o login passa a usar o novo. Confirmação alinhada ao padrão de provisionamento (evitar conta “fantasma” sem login). |
| Nome de exibição | Como a pessoa aparece na Equipe e no shell. |
| Nome clínico | Nome do dentista na agenda. |
| CRO | Registro profissional (opcional). |
| Cor da agenda | Cor do evento do dentista; formato `#` + seis dígitos hexadecimais. Entrada simples (cor nativa + texto); sem seletor elaborado no MVP. |
| Ativo na agenda | Se o dentista aparece como recurso de agenda. **Independente** de ativo no sistema. |

A ficha de agenda **só aparece na edição** se já existir vínculo com o perfil. Esta fatia **não** cria ficha automaticamente ao promover alguém a dentista (comportamento atual permanece). Botão “vincular ficha” fica **fora** deste corte se não houver linha.

### 4.3 Controle de acesso (já existente, reforçado)

| Ação | Significado |
| ---- | ----------- |
| Trocar papel | Muda o papel do colaborador-alvo. |
| Ativar / desativar acesso | Liga ou desliga o acesso ao sistema (preserva histórico; não é exclusão). |
| Convidar | Cria colaborador e envia (ou mostra) credencial temporária conforme modo já existente. |
| Reenviar convite | Novo envio / nova senha temporária para quem ainda precisa definir senha. |

Exclusão definitiva da conta **continua fora de escopo**.

### 4.4 Matriz RBAC (modelo B · fechado)

| Ação | Admin | Recepção |
| ---- | ----- | -------- |
| Ver Equipe e listar colaboradores | sim | sim |
| Editar e-mail de login | sim (qualquer alvo) | sim (alvo **não-admin**) |
| Editar nome de exibição | sim (qualquer alvo) | sim (alvo **não-admin**) |
| Editar ficha de agenda (quando existir) | sim | sim (alvo **não-admin**; ficha ligada ao perfil) |
| Criar colaborador / reenviar convite | sim (qualquer papel) | sim (**só** papéis não-admin; reenvio se alvo não for admin) |
| Trocar papel | sim | **não** |
| Ativar / desativar acesso | sim | **não** |
| Alterar o próprio papel ou o próprio ativo | **não** | **não** |
| Editar o próprio e-mail / próprio nome | **sim** | **sim** |
| Editar / convidar / reenviar alvo com papel admin | sim | **não** |

Papéis convidáveis pela recepção: dentista, recepção, auxiliar de sala, visualizador.

### 4.5 Auditoria e mensagens

Ações sensíveis de edição registram auditoria operacional (e-mail atualizado, perfil atualizado, ficha de agenda atualizada), no mesmo espírito da F7-11.

Copy pt-BR (sem travessão), incluindo pelo menos: e-mail em uso, e-mail atualizado, ficha salva, sem permissão, cor inválida.

### 4.6 Navegação

Equipe continua acessível pelo **menu de conta** (como hoje para o admin). O dock mobile **não** ganha sexto ícone. A recepção passa a ver o item Equipe quando o módulo for liberado para o papel.

---

## 5. Matriz de acesso (módulo Equipe)

| Papel | Ver Equipe | Editar dados (modelo B) | Controle de acesso (papel / ativo) | Convidar / reenviar |
| ----- | ---------- | ----------------------- | ---------------------------------- | ------------------- |
| Administrador | sim | qualquer colaborador | sim | qualquer papel |
| Recepção | sim | só alvos não-admin (e a si: e-mail/nome) | não | só papéis não-admin |
| Dentista | não | não | não | não |
| Auxiliar de sala | não | não | não | não |
| Visualizador | não | não | não | não |

Guarda de página e menu alinhadas: quem não tem o módulo recebe acesso negado fail-secure; a recepção deixa de ser bloqueada na Equipe.

---

## 6. Escopo funcional

### 6.1 Listagem

- Lista de colaboradores com e-mail, nome, papel, situação e última informação já exibida na F7-11.
- Incluir, quando existir, dados resumidos da ficha de agenda suficientes para montar a edição sem ida extra à tela.
- Recepção **não** vê seletor de papel nem botões desativar/reativar.
- Admin mantém os controles de papel e ativo da F7-11.

### 6.2 Editar colaborador

- Botão **Editar** por linha, visível conforme a matriz B.
- Diálogo (ou superfície equivalente): nome de exibição, e-mail; se houver ficha de agenda, seção Agenda (nome clínico, CRO, cor, ativo na agenda).
- Validar e-mail e cor antes de gravar; falhas amigáveis.
- Após salvar e-mail com sucesso, o login do alvo usa o novo endereço.
- Após salvar nome clínico / cor / ativo na agenda, a agenda e a Hoje que leem dentistas refletem na próxima carga.

### 6.3 Convite e reenvio (ajuste recepção)

- Diálogo de convite: se o ator for recepção, a lista de papéis **não** oferece administrador.
- Servidor recusa convite ou reenvio que viole a matriz B, mesmo se a UI falhar.
- Admin permanece com o comportamento atual (qualquer papel).

### 6.4 Troca de papel e ativo

- Continuam exclusivos de quem **gerencia acesso** (só admin).
- Bloqueio de autoalteração de papel/ativo permanece.
- Regra de não remover o último admin ativo permanece.
- Defesa em profundidade: mesmo fora da UI, não-admin não consegue alterar papel nem ativo do perfil.

### 6.5 Domínio puro e testes

- Regras nomeadas da matriz B (quem acessa Equipe, quem gerencia acesso, quem edita dados de qual alvo, quais papéis a recepção pode convidar).
- Validação de cor hex e de e-mail nos schemas da feature.
- Vitest cobre guards e recusa de convite admin pela recepção.

### 6.6 Persistência e segurança

- Atualização de e-mail de login e de nome de exibição via caminho privilegiado de servidor já usado no provisionamento, com guarda de domínio espelhando a matriz B.
- Ficha de agenda via sessão autenticada (políticas atuais já permitem escrita de admin e recepção).
- Migration nova **somente se** a revisão de segurança exigir reforço de trigger/policy (ex.: só admin altera papel/ativo). Sem migration cosmética.
- Sem segredo no cliente; fail secure; checklist aplicável de `docs/SECURITY.md`.

### 6.7 Documentação ao fechar a fatia

- Registro em `docs/implementation/` (F7-11b).
- Capítulo em `docs/manual-dev/` (edição da equipe / extensão F7-11).
- `docs/state/PENDENCIAS.md`: item “recepção não vê Equipe” vira “recepção vê Equipe com poderes B”; homologação manual listada se ainda aberta.
- Índices de implementation e manual-dev atualizados.
- Opcional: menção curta em `docs/SECURITY.md` sobre quem altera e-mail no servidor.

### 6.8 Homologação sugerida (não fecha Fase 7)

Casos manuais sugeridos (extensão FL-11 / TCs novos no relatório manual quando rodar):

- Recepção edita e-mail de dentista; login com e-mail novo.
- Recepção edita CRO/cor; agenda reflete.
- Recepção tenta convidar admin → negado.
- Admin desativa colaborador; recepção não vê o controle.
- Recepção não edita linha de admin.

---

## 7. Fora de escopo

- Exclusão definitiva de colaborador / conta de autenticação.
- Redefinir senha pelo admin além do reenvio / recovery já existentes.
- Criar automaticamente ficha de agenda ao mudar papel para dentista.
- Botão “vincular ficha de agenda” quando não houver vínculo (corte futuro, só admin).
- Sexto ícone no dock mobile.
- Dentista, auxiliar e visualizador com acesso a Equipe.
- OCR, Vision, estoque, WhatsApp inbox, DeskcommCRM.
- Fechar a Fase 7 completa.
- Homologação `manual-report` completa da fase (casos desta fatia podem entrar quando o relatório rodar; não bloqueiam o Done de código se o trio de docs e os testes automatizados fecharem).

---

## 8. Caminhos felizes

### 8.1 Admin corrige e-mail e nome de um dentista

1. Admin abre Equipe pelo menu de conta.
2. Na linha do dentista, aciona **Editar**.
3. Altera nome de exibição e e-mail; salva.
4. Sistema confirma; lista mostra os novos valores.
5. O dentista entra com o e-mail novo.

### 8.2 Recepção atualiza ficha de agenda

1. Recepção abre Equipe.
2. Edita dentista não-admin com ficha vinculada: CRO, cor `#RRGGBB`, ativo na agenda.
3. Salva; mensagem de ficha salva.
4. Na agenda / Hoje, nome clínico e cor refletem.

### 8.3 Recepção convida auxiliar e reenvia

1. Recepção convida papel auxiliar de sala (ou dentista / recepção / visualizador).
2. Convite segue o fluxo já existente (e-mail ou senha temporária).
3. Se preciso, reenvia convite para o mesmo alvo não-admin.

### 8.4 Admin convida outro admin e desativa acesso

1. Admin convida papel administrador.
2. Admin desativa um colaborador não-último-admin.
3. Lista reflete inativo; o desativado não opera o sistema.

### 8.5 Colaborador edita o próprio nome

1. Admin ou recepção abre a própria linha (quando a UI permitir Editar para si).
2. Altera só nome de exibição (e/ou e-mail).
3. Controles de papel e ativo na própria linha continuam ausentes / bloqueados.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Recepção tenta convidar admin | Recusa com mensagem sem permissão; opção admin ausente na UI | UI + servidor + teste |
| Recepção tenta editar conta admin | Sem botão Editar / recusa no servidor | Matriz B |
| Recepção tenta trocar papel ou desativar | Controles ausentes; servidor recusa se chamado | Só quem gerencia acesso |
| E-mail já em uso | Mensagem “e-mail em uso”; nada sobrescreve outra conta | Tratamento do provedor de auth |
| Cor inválida (não `#RRGGBB`) | Recusa na validação; agenda não quebra | Schema estrito |
| Alvo sem ficha de agenda | Seção Agenda oculta; demais campos editáveis | Sem auto-criação |
| Auto-troca de papel/ativo | Bloqueada (já F7-11) | Guarda + trigger |
| Último admin ativo | Não pode ser desativado / rebaixado se isso zerar admins | Regra existente |
| Confirmação de e-mail trava login | Atualização confirma e-mail conforme padrão do provisionamento | Premissa do plano |
| Papel sem Equipe abre a rota | Acesso negado fail-secure | Guarda de página + módulo |
| Drift: recepção altera papel fora da UI | Trigger / política: só admin muda papel e ativo | Defesa em profundidade |
| Falha genérica ao salvar | Mensagem amigável; estado anterior preservado | Fail secure |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho §8.1: admin edita e-mail e nome de dentista no ClinRoma; login usa o e-mail novo.
- [ ] Caminho §8.2: recepção edita e-mail/nome/CRO/cor de dentista não-admin; agenda reflete cor/nome clínico.
- [ ] Caminho §8.3: recepção convida e reenvia só papéis não-admin.
- [ ] Recepção **não** convida admin, **não** troca papel, **não** desativa acesso, **não** edita conta admin (§9).
- [ ] Admin mantém papel, ativo e convite admin (§8.4).
- [ ] Matriz §4.4 / §5 na interface e no servidor.
- [ ] Vitest cobre guards da matriz B e recusa de convite admin pela recepção; validação de cor/e-mail.
- [ ] Autorização fail-secure; checklist aplicável de `docs/SECURITY.md` (authz no servidor, sem segredo no cliente, auditoria sem PHI desnecessário).
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11 (salvo atualização desta spec se o escopo mudar com aprovação).
- [ ] Arquivos novos ≤ ~300 linhas (dividir por domínio se crescer).
- [ ] Docs ao fechar a fatia: `docs/implementation/F7-11b-edicao-equipe.md`, capítulo manual-dev, `docs/state/PENDENCIAS.md` e índices atualizados (§6.7).

### Qualidade

- [ ] Recepção vê Equipe no menu de conta; dock mobile inalterado (sem 6º ícone).
- [ ] Controles de acesso ocultos para recepção; visíveis para admin.
- [ ] Lista carrega vínculo opcional da ficha de agenda para o diálogo de edição.

### Explicitamente **não** exigido nesta spec

- Fechar a Fase 7.
- Homologação `manual-report` completa da fase (TCs desta fatia podem ser registrados quando o relatório rodar).
- Cobertura 80% global do repositório (domínio da matriz B + schemas desta fatia bastam).
- Seletor de cor elaborado; exclusão hard; auto-criação de ficha de agenda.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec e nova aprovação.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-09-09-equipe-edicao.md` | Esta spec |
| `src/features/team/components/edit-collaborator-dialog.tsx` | Diálogo de edição de dados |
| `supabase/migrations/029_team_edit_f7.sql` | **Só se** reforço de trigger/policy for necessário |
| `docs/implementation/F7-11b-edicao-equipe.md` | Fechamento da fatia |
| `docs/manual-dev/21-fase-7-11b-edicao-equipe.md` | Manual do dev da fatia (nome ajustável se o índice exigir) |
| Testes novos sob `src/features/team/**` e/ou `src/lib/auth/**` | Guards, schemas, matriz B |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/lib/auth/roles.ts` | Liberar módulo Equipe para recepção com escrita operacional |
| `src/lib/auth/roles.test.ts` | Expectativas da recepção com Equipe |
| `src/features/team/domain/team-guards.ts` | Matriz B (acesso, gerir acesso, editar dados, papéis convidáveis) |
| `src/features/team/domain/*.test.ts` | Testes dos guards |
| `src/features/team/schemas.ts` | Schemas de edição de perfil e ficha de agenda |
| `src/features/team/actions.ts` | Actions de edição; restringir convite/reenvio/papel/ativo |
| `src/features/team/queries.ts` | Listagem com vínculo opcional da ficha de agenda |
| `src/features/team/lib/team-action-context.ts` | Distinguir acesso à Equipe vs gestão de acesso |
| `src/features/team/components/collaborator-row.tsx` | Botão Editar; ocultar controles para recepção |
| `src/features/team/components/collaborator-dialog.tsx` | Convite sem opção admin para recepção |
| `src/features/team/components/collaborator-list.tsx` | Encaixe do diálogo / feedback |
| `src/app/(app)/equipe/page.tsx` | Guarda aceita recepção |
| Shell / menu de conta que lista módulos | Só se necessário para o item Equipe da recepção |
| `docs/state/PENDENCIAS.md` | Atualizar F7-11 / F7-11b após o código |
| `docs/implementation/README.md` | Índice no fechamento |
| `docs/manual-dev/README.md` | Índice no fechamento |
| `docs/SECURITY.md` | Opcional: quem altera e-mail no servidor |
| `docs/plans/plano-edicao-equipe.md` | Opcional: marcar plano aprovado / alinhado à spec |

### Proibido alterar nesta feature

- Fluxo de exclusão hard de usuário de autenticação.
- Deskcomm / inbox WhatsApp / disparos de paciente.
- Seed de dentistas além do mínimo para homologação.
- OCR, Vision, estoque, fila, prontuário, agenda (exceto revalidação de paths que leem dentistas, se a action já o fizer).
- `.env` / secrets sem confirmação explícita.
- Specs de outras fatias, salvo referência cruzada pedida.
- Dependência nova só para seletor de cor.

**Branch sugerida (após aprovação desta spec):** `feature/equipe-edicao`.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Escopo de dados: e-mail + nome de exibição + ficha de agenda do dentista (quando existir) |
| 2 | Papel da recepção: **modelo B** (dados + convite/reenvio não-admin; controle de acesso só admin) |
| 3 | Editar o próprio e-mail e o próprio nome: **permitido**; auto-troca de papel/ativo: **bloqueada** |
| 4 | Não criar ficha de agenda automaticamente ao promover a dentista |
| 5 | Cor: hex `#RRGGBB`; input simples; sem seletor fancy |
| 6 | Exclusão definitiva fora de escopo |
| 7 | E-mail e nome via caminho privilegiado de servidor nas actions; ficha de agenda via sessão autenticada |
| 8 | Migration só se trigger/policy precisarem de reforço |
| 9 | Dock mobile sem 6º ícone; Equipe pelo menu de conta |
| 10 | Fatia **não** fecha a Fase 7 |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Recepção promove a admin | Select e validação sem admin; action recusa; teste |
| Recepção desativa admin | UI sem toggle; action só quem gerencia acesso |
| E-mail duplicado | Erro amigável; sem sobrescrita |
| Cor inválida quebra CSS da agenda | Validação hex estrita |
| Drift: recepção altera papel no banco | Trigger: não-admin não altera papel/ativo |
| Confirmar e-mail trava login | Confirmação alinhada ao provisionamento |
| Pendência F7-11 “recepção sem Equipe” fica desatualizada | Atualizar PENDENCIAS no fechamento |

---

## 14. Referências

- Plano: `docs/plans/plano-edicao-equipe.md`
- Implementação pai: `docs/implementation/F7-11-gestao-acessos.md`
- Manual / índice: `docs/manual-dev/`
- Pendências: `docs/state/PENDENCIAS.md` · seção Gestão de acessos · Equipe (F7-11)
- Segurança: `docs/SECURITY.md`
- Plano geral: `docs/PLANO.md` · Fase 7
- Skill de fechamento: `.cursor/skills/close-phase/SKILL.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

**Próximo passo após aprovação explícita desta spec:** criar a branch `feature/equipe-edicao` e implementar **somente F7-11b**, sem código até você aprovar.
