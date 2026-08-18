# Fase 3 · Pacientes e prontuário

| Status             | Spec                                              |
| ------------------ | ------------------------------------------------- |
| concluída (código) | `specs/2026-08-18-fase-3-pacientes-prontuario.md` |

## O que esta fase entrega

- **Lista e busca** de pacientes em `/pacientes`
- **Cadastro** com consentimento LGPD obrigatório (`/pacientes/novo`)
- **Ficha clínica** (`/pacientes/[id]`) com abas: Resumo, Anamnese, Odontograma, Evoluções
- **Anamnese versionada** (formulário Dr. Fellipe S. Roma v1), alerta após 12 meses
- **Odontograma FDI** (desktop + mobile com zoom/pan)
- **Evolução** com foto (`capture="environment"`) e gravador de áudio com upload em blocos
- **Transcrição Whisper** assíncrona com polling na UI
- **Auditoria** ao abrir ficha e ao salvar alterações clínicas
- Link **Abrir prontuário** na agenda e em Hoje (`?consulta=` na URL)

**Não entrega:** fila Kanban, estoque, lembrete, painel de auditoria, edição manual da transcrição.

---

## Árvore de pastas

```text
src/features/patients/
├── domain/cpf.ts
├── queries.ts · actions.ts · schemas.ts
└── components/
    ├── patient-list.tsx
    ├── patient-form.tsx
    └── patient-summary.tsx

src/features/records/
├── domain/          # anamnese, FDI, anexos, formulário v1
├── queries.ts · actions.ts · schemas.ts · permissions.ts
├── lib/             # upload-audio-chunk, pick-audio-mime
└── components/      # ficha, anamnese, odontograma, evolução, gravador

src/lib/transcription/
├── whisper.ts
└── enqueue-transcription.ts

src/app/api/records/
├── audio-chunk/route.ts
└── transcribe/route.ts
```

---

## Fluxos principais

### Recepção cadastra paciente

1. `/pacientes` → **Novo paciente**
2. Preenche dados + checkbox LGPD + nome da assinatura
3. Redireciona para ficha do paciente

### Dentista documenta atendimento (mobile)

1. **Agenda** ou **Hoje** → consulta → **Abrir prontuário**
2. Aba **Evoluções** → criar evolução (consulta já vinculada)
3. Foto da etiqueta + gravar prescrição em áudio
4. Transcrição aparece com polling (3 s) sem recarregar a página

### Visualizador

- Vê dados cadastrais; abas clínicas ocultas na UI
- RLS bloqueia conteúdo clínico no banco

---

## Matriz resumida

| Ação                    | admin | reception | dentist | viewer |
| ----------------------- | ----- | --------- | ------- | ------ |
| Listar/buscar pacientes | Sim   | Sim       | Sim     | Sim    |
| Cadastro + LGPD         | Sim   | Sim       | Sim     | Não    |
| Ver prontuário clínico  | Sim   | Sim       | Sim     | Não    |
| Anamnese / odontograma  | Sim   | Sim       | Sim     | Não    |
| Evolução com foto/áudio | Sim   | Não       | Sim     | Não    |
| Retentar transcrição    | Sim   | Não       | Sim     | Não    |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso na F3                    |
| ------------ | ---------------------- | ---------------------------- |
| Admin        | admin@clinroma.dev     | Tudo                         |
| Recepção     | reception@clinroma.dev | Cadastro, leitura clínica    |
| Dentista     | dentist@clinroma.dev   | Evolução, áudio, transcrição |
| Visualizador | viewer@clinroma.dev    | Só cadastro                  |

Paciente seed com prontuário demo: **Maria Silva** (consulta hoje na agenda).

---

## Variáveis de ambiente

| Variável         | Onde        | Uso                 |
| ---------------- | ----------- | ------------------- |
| `OPENAI_API_KEY` | Server only | Transcrição Whisper |

Documentada em `.env.example`. Sem a chave, áudio é salvo mas transcrição falha com mensagem amigável.

---

## Homologação manual pendente

Obrigatório antes de fechar operacionalmente (ver `docs/state/PENDENCIAS.md`):

1. **iPhone real:** fluxo §8.5 completo (HTTPS local via `npm run dev`)
2. **Android real:** mesmo fluxo com WebM/Opus
3. Desktop: recepção cadastra; dentista anamnese + odontograma

Relatório formal `manual-report`: Fase 6.

---

## Comandos úteis

```bash
npm run dev          # HTTPS (microfone/câmera)
npm run db:push      # migrations 012/013
npm run test         # domínio F3
npm run build
```

---

## Referências

- Entrega técnica: [`docs/implementation/F3-pacientes-prontuario.md`](../implementation/F3-pacientes-prontuario.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Próxima fase: Fila Kanban (Fase 4)
