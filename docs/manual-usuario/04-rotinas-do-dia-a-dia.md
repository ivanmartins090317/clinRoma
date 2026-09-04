# 4 · Rotinas do dia a dia

Passo a passo do que cada função costuma fazer no ClinRoma, do início ao fim do expediente.

---

## Recepção

### Abertura do dia

1. Entrar no ClinRoma
2. Abrir **Hoje** e conferir consultas do dia
3. Verificar se há alertas de estoque (avisar auxiliar se necessário)
4. Conferir **Fila Kanban** (pacientes aguardando encaixe)

### Paciente novo chegando

1. **Pacientes** → **Novo paciente**
2. Preencher dados e consentimento LGPD
3. **Agenda** → marcar a consulta (paciente, dentista, horário)

### Remarcar ou cancelar

1. **Agenda** (computador)
2. Localizar a consulta
3. Arrastar para novo horário **ou** abrir e escolher cancelar/remarcar
4. Se cancelou e há fila: considerar **Oferecer vaga na fila**

### Encaixe pela fila

1. **Fila** → incluir paciente (se ainda não estiver)
2. Quando surgir horário: **Oferecer vaga na fila**
3. Copiar link e enviar ao paciente por WhatsApp ou SMS
4. Acompanhar coluna **Oferta enviada** (40 min de validade)
5. Após aceite: confirmar consulta na **Agenda** e em **Hoje**

### Durante o atendimento

- Se o dentista pedir: abrir prontuário pela consulta e ajudar com **anamnese** (se orientada)
- **Não** registrar evolução clínica (isso é com o dentista)

### Fim do atendimento

1. Confirmar com o dentista se a evolução foi registrada
2. Editar a consulta na **Agenda** e marcar situação como **Concluída** (dispara lembrete por e-mail ao dentista)

---

## Dentista

### Antes do primeiro paciente

1. Entrar no ClinRoma (celular ou computador)
2. **Hoje** ou **Agenda** → ver sua lista do dia
3. No celular, filtro pode já mostrar só seus horários

### Durante o atendimento

1. Abrir a consulta → **Abrir prontuário**
2. Revisar **Anamnese** se necessário
3. Atualizar **Odontograma** se houver achado
4. Aba **Evoluções**:
   - Criar evolução da consulta
   - Foto se precisar (ex.: receita, etiqueta)
   - Gravar **áudio** com prescrição e orientações
   - Aguardar transcrição aparecer na tela

### Após o atendimento

1. Conferir se evolução e áudio foram salvos
2. Avise a **recepção** para marcar a consulta como **Concluída** na agenda (isso dispara o lembrete por e-mail)

### O que o dentista **não** faz no sistema (piloto atual)

- Marcar, remarcar ou cancelar horários na agenda (recepção)
- Marcar consulta como concluída (recepção ou administrador)
- Operar fila de encaixe (recepção)
- Escanear QR de estoque (auxiliar)

---

## Auxiliar de sala

### Preparação de materiais

1. Entrar no ClinRoma no **celular**
2. **Estoque** → conferir saldos
3. Se recebeu material novo:
   - Abra o insumo → aba **Entrada** (ou **Registrar compra**)
   - Informe a quantidade da embalagem (use o **total** se for um único monte na prateleira)
   - Gere **uma** etiqueta, use **Ver / baixar QR** ou imprima, e cole na prateleira / embalagem
4. Confira na aba **Pacotes** se a etiqueta ativa aparece com o restante correto

### Durante o procedimento

1. Abrir **Scan QR** (ou atalho na tela inicial do celular)
2. Escanear o QR **já colado** na embalagem usada (sempre o mesmo, enquanto houver restante)
3. Confirmar quantidade retirada
4. Repetir para cada material consumido

**Não** abra a aba **Entrada** / “gerar QR” só para ver a etiqueta. Para ver ou baixar de novo: detalhe do insumo → **Pacotes** → **Ver / baixar QR**.

### Quando o saldo está baixo

- O alerta aparece em **Estoque** e em **Hoje** (equipe administrativa vê)
- Avise recepção ou administrador para repor

### O que a auxiliar **não** acessa

- Agenda, pacientes e fila (perfil restrito de propósito)

---

## Administrador

O administrador pode fazer **tudo** que os outros perfis fazem, mais:

| Tarefa | Onde |
| ------ | ---- |
| Cadastrar e editar insumos | Estoque |
| Corrigir retirada excepcional / ajuste de saldo | Detalhe do insumo (abas) |
| Reenviar lembretes com falha | Hoje |
| Gerenciar usuários e perfis | (via suporte técnico / Supabase no piloto) |
| Consultar auditoria do prontuário | (painel técnico; em evolução) |

### Checklist semanal sugerido

- [ ] Revisar lembretes com falha em **Hoje**
- [ ] Conferir insumos zerados ou abaixo do mínimo
- [ ] Validar se novos colaboradores têm o perfil correto

---

## Visualizador

Perfil de **somente leitura** para quem precisa consultar sem alterar:

- Ver **Hoje** e **Agenda**
- Buscar pacientes e ver **dados cadastrais**
- **Não** vê prontuário clínico, fila nem estoque

Útil para gestão que acompanha ocupação sem mexer em registros clínicos.

---

## Cenários combinados (equipe)

### Cancelamento de última hora com fila cheia

1. Recepção cancela consulta na **Agenda**
2. Sistema sugere oferta à **Fila**
3. Recepção escolhe paciente prioritário (vermelho primeiro)
4. Envia link; se aceitar em até 40 min, horário preenchido

### Primeira consulta de paciente novo

1. Recepção cadastra em **Pacientes**
2. Marca consulta na **Agenda**
3. No dia: recepção ou dentista preenche **Anamnese** na ficha
4. Dentista registra **Evolução** ao final

### Dia com muitos procedimentos e consumo de material

1. Auxiliar confere se cada material da prateleira tem **uma etiqueta ativa** visível
2. A cada procedimento: **Scan QR** das retiradas (mesmo QR, quantidades parciais)
3. Fim do dia: administrador ou auxiliar confere saldos em **Estoque** e se o restante das etiquetas bate com o físico

---

## Próximo passo

Dúvidas e soluções rápidas: [05-duvidas-frequentes.md](./05-duvidas-frequentes.md).
