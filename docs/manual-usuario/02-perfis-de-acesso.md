# 2 · Perfis de acesso: quem pode fazer o quê

Cada colaborador tem um **perfil** (também chamado de papel ou role). O perfil define o que aparece no menu e o que você pode alterar no sistema.

Existem **5 perfis** no ClinRoma:

| Perfil | Quem costuma ser | Em uma frase |
| ------ | ---------------- | ------------ |
| **Administrador** | Dono, gerente ou TI da clínica | Acesso total |
| **Recepção** | Atendimento na recepção | Agenda, pacientes e fila |
| **Dentista** | Profissional clínico | Prontuário e evolução do paciente |
| **Auxiliar de sala** | Quem prepara materiais na sala | Estoque e scan de QR |
| **Visualizador** | Quem só precisa consultar | Leitura, sem alterar nada clínico |

---

## Visão geral: o que cada perfil vê no menu

| Módulo | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ------ | :---: | :------: | :------: | :------: | :----------: |
| Hoje | Sim | Sim | Sim | Não | Sim |
| Agenda | Sim | Sim | Sim* | Não | Sim* |
| Pacientes | Sim | Sim | Sim | Não | Sim** |
| Fila Kanban | Sim | Sim | Sim* | Não | Não |
| Estoque | Sim | Sim* | Sim* | Sim | Não |
| Scan QR | Sim | Não | Não | Sim | Não |

\* Somente **consultar** (sem criar ou alterar, conforme o módulo).  
\*\* Somente **dados cadastrais** (nome, contato). Sem prontuário clínico.

---

## Tabela prática: ações do dia a dia

### Pacientes

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Buscar paciente na lista | Sim | Sim | Sim | Não | Sim |
| Cadastrar paciente novo | Sim | Sim | Sim | Não | Não |
| Ver prontuário (anamnese, odontograma) | Sim | Sim | Sim | Não | Não |
| Preencher anamnese e odontograma | Sim | Sim | Sim | Não | Não |
| Registrar evolução (texto, foto, áudio) | Sim | Não | Sim | Não | Não |

### Agenda

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver consultas | Sim | Sim | Sim | Não | Sim |
| Marcar consulta nova | Sim | Sim | Não | Não | Não |
| Remarcar ou cancelar | Sim | Sim | Não | Não | Não |
| Marcar consulta como concluída | Sim | Sim | Não | Não | Não |

### Fila de encaixe

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver fila | Sim | Sim | Sim | Não | Não |
| Incluir paciente na fila | Sim | Sim | Não | Não | Não |
| Enviar oferta de horário (link) | Sim | Sim | Não | Não | Não |

### Estoque

| Ação | Admin | Recepção | Dentista | Auxiliar | Visualizador |
| ---- | :---: | :------: | :------: | :------: | :----------: |
| Ver saldos e alertas | Sim | Sim | Sim | Sim | Não |
| Cadastrar ou editar insumo | Sim | Não | Não | Não | Não |
| Registrar compra e gerar QR | Sim | Não | Não | Sim | Não |
| Escanear QR para retirada | Sim | Não | Não | Sim | Não |

### Administração (somente administrador)

- Ver histórico de auditoria do prontuário
- Reenviar lembretes que falharam
- Gerenciar perfis de outros usuários
- Corrigir retirada de estoque em casos excepcionais

---

## Por que a recepção não registra evolução clínica?

A **evolução** (nota do atendimento, foto, gravação de áudio da prescrição) é responsabilidade do **dentista** ou do **administrador**. A recepção cuida do cadastro, da agenda e da fila, e pode ajudar com anamnese e odontograma quando orientada, mas não registra evolução sozinha.

Isso protege o registro clínico e deixa claro quem documentou o atendimento.

---

## Por que o dentista não marca consulta?

No piloto, **marcar, remarcar e cancelar horários** fica com a **recepção** (e o administrador). O dentista consulta a agenda, abre o prontuário a partir da consulta e marca o atendimento como concluído quando termina.

Se no futuro a clínica quiser mudar essa regra, o administrador pode avaliar com o suporte técnico.

---

## Recebi mensagem "Acesso negado"

Significa que você tentou abrir uma página fora do seu perfil (por exemplo, recepção tentando abrir o Scan QR).

**O que fazer:** volte ao menu e use só os módulos disponíveis. Se acredita que deveria ter acesso, fale com o administrador da clínica para revisar seu perfil.

---

## Próximo passo

Detalhes de cada tela estão em [03-guia-dos-modulos.md](./03-guia-dos-modulos.md).
