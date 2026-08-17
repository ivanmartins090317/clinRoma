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

| Superfície | Auth | Regra |
| --- | --- | --- |
| `/`, marketing | Público | Sem PHI |
| `/login` | Auth Supabase | Rate limit login |
| `/(app)/*` | Sessão + role | RLS por `clinic_id` |
| `/fila/resposta/[token]` | Token opaco | Expira 40 min; mínimo de dados; consentimento LGPD |
| `/api/*` | Server-only secrets | Validar sessão ou assinatura webhook |

## LGPD / link ao paciente (fila)

- Token único, não sequencial; expira com a oferta (40 min).
- Página pública: só nome parcial + horário oferecido; sem prontuário completo.
- Checkbox de consentimento antes de aceitar/recusar.
- Registrar `patient_slot_responses` com timestamp; sem logar IP completo em texto claro (hash se necessário).
- Link enviado por canal acordado com a clínica (SMS/WhatsApp manual da recepção na v1).

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
- [ ] Rotas públicas (token fila) sem enumeração de IDs

## Fora do escopo v0.1

- Export LGPD automatizado
- OCR planilha sem revisão humana
- Integração WhatsApp Business completa
