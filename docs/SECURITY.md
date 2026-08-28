# Padrões de Segurança — ClinRoma

> Versão 0.1 · Base OWASP Top 10 (2021) · Stack: Next.js · Supabase
> Dados de saúde (PHI) · LGPD · Cliente piloto: Clínica Neo Roma

## Princípios

1. Zero trust no cliente.
2. Defense in depth: RLS **e** checagem na server action / route handler.
3. Menor privilégio por papel (`admin`, `dentist`, `reception`, `room_assistant`).
4. Fail secure.
5. Segredos fora do código (`.env` / Vercel).

## Superfícies

| Superfície               | Auth                | Regra                                                                 |
| ------------------------ | ------------------- | --------------------------------------------------------------------- |
| `/`, marketing           | Público             | Sem PHI                                                               |
| `/login`                 | Auth Supabase       | Rate limit login                                                      |
| `/(app)/*`               | Sessão + role       | RLS por sessão e papel                                                |
| `/fila/resposta/[token]` | Token opaco         | Expira 40 min; mínimo de dados; consentimento LGPD                    |
| `/anamnese/[token]`      | Token opaco         | Pré-consulta 7 dias ou fim do dia (SP); nome + questionário em branco |
| `/api/*`                 | Server-only secrets | Validar sessão ou assinatura webhook                                  |

## LGPD / link ao paciente (fila)

- Token único, não sequencial; expira com a oferta (40 min).
- Página pública: só nome parcial + horário oferecido; sem prontuário completo.
- Checkbox de consentimento antes de aceitar/recusar.
- Registrar `patient_slot_responses` com timestamp; sem logar IP completo em texto claro (hash se necessário).
- Link enviado por canal acordado com a clínica (SMS/WhatsApp manual da recepção na v1).

## LGPD / convite de anamnese

- Segredo só no link; o banco guarda a impressão digital (SHA-256), nunca o valor em claro.
- Link opaco: não sequencial e sem nome, documento ou id previsível do paciente.
- Página pública: nome completo + questionário em branco; sem menu da clínica, CPF, prontuário, respostas anteriores.
- Inválido, expirado ou já usado: a mesma mensagem genérica (`Link inválido ou expirado.`).
- Consentimento visível antes do envio. Sem a marca, o envio não conclui.
- Limite de tentativas por impressão digital de origem; IP nunca em claro nos logs.
- Quem tem o link válido envia; quem não tem o segredo não lê o paciente.
- Auditoria de geração e envio: finalidade e paciente; sem corpo do questionário e sem segredo.

## Estoque baixo · e-mail ao financeiro

- Destino só no ambiente (`FINANCE_ALERT_EMAIL`). Vazio ou inválido: a rotina não dispara.
- E-mail sem PHI (sem paciente, CPF, prontuário ou QR). Destino mascarado se logar.
- Rotina `/api/cron/process-stock-finance-alerts` protegida por `CRON_SECRET` (mesmo segredo das outras).
- Falha do aviso não reverte movimentação de estoque. Sem `service_role` no client.

## PHI / prontuário

- Buckets Storage **privados** (fotos etiqueta, áudio, planilhas).
- Audit log em leitura/escrita de prontuário.
- Sentry/logs: **sem** corpo de anamnese, áudio ou CPF.

## Checklist DoD (feature)

- [ ] RLS nas tabelas tocadas
- [ ] Autorização revalidada server-side
- [ ] Zod na borda
- [ ] Sem `service_role` no client
- [ ] Upload: MIME/tamanho; path UUID
- [ ] Rotas públicas (token fila / convite de anamnese) sem enumeração de IDs

## Fora do escopo v0.1

- Export LGPD automatizado
- OCR planilha sem revisão humana
- Integração WhatsApp Business completa
