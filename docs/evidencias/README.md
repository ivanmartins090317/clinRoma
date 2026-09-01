# Evidências · homologação manual ClinRoma

Screenshots dos casos de teste (TC) do relatório `docs/relatorio-testes-manuais.html`.

## Nomenclatura

```
tc01-login-admin.jpeg
tc14-audio-iphone.jpeg
tc27-scan-cr-dev001.jpeg
```

Padrão: `tc[número]-[descricao-curta].jpeg` (ou `.png` / `.webp`).

## Contas seed

Senha de dev: `ClinRomaDev2026!` (nunca em produção).

| Perfil | E-mail |
| ------ | ------ |
| Admin | `admin@clinroma.dev` |
| Recepção | `reception@clinroma.dev` |
| Dentista | `dentist@clinroma.dev` |
| Auxiliar | `assistant@clinroma.dev` |
| Visualizador | `viewer@clinroma.dev` |

## Fluxos

| Código | Fluxo | TCs |
| ------ | ----- | --- |
| FL-01 | Login e papéis (5 perfis + logout) | TC-01 a TC-06 |
| FL-02 | Agenda | TC-07 a TC-12 |
| FL-03 | Prontuário (mobile real + F7-01/02/08) | TC-13 a TC-20 |
| FL-04 | Fila e link público LGPD | TC-21 a TC-26 |
| FL-05 | Estoque, scan e e-mail financeiro | TC-27 a TC-33 |
| FL-06 | Lembrete pós-consulta | TC-34 a TC-36 |
| FL-07 | PWA scan | TC-37 a TC-38 |
| FL-08 | Segurança smoke | TC-39 a TC-42 |
| FL-09 | Card, anamnese isolada e 2º telefone | TC-43 a TC-48 |
| FL-10 | WhatsApp (sessão e pós-cirurgia) | TC-49 a TC-56 |
| FL-11 | Equipe (gestão de acessos) | TC-57 a TC-63 |
