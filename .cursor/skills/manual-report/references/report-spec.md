# Especificação Técnica — Relatório de Testes Manuais HTML

> **Projeto:** Zelita  
> **Padrão:** POP-QA-ZELITA-001  
> **Fonte de cores:** protótipo + `marca-zelita.html` (light-first)

---

## Paleta de Cores (CSS Variables)

Alinhada à marca Zelita. **Nunca** use a paleta Surf (lima `#C4FA4E`) nem ByStartup (`#6c63ff`).  
**Coral** (`--coral`) só para SOS / emergência no relatório — não como accent genérico.

```css
:root {
  /* Neutros / sand */
  --bg-page: #f2efe8;
  --bg-card: #faf7f2;
  --bg-card2: #ffffff;
  --bg-card3: #eef8f5;
  --border: #e4e0d8;
  --border-strong: #d6d0c6;

  /* Marca — verde-petróleo */
  --accent: #12766e;
  --accent-hover: #0f5b54;
  --accent-pressed: #0b3b36;
  --accent-glow: rgba(18, 118, 110, 0.12);
  --on-accent: #ffffff;
  --brand-900: #072b27;
  --brand-800: #0b3b36;
  --brand-200: #a9e0d5;
  --brand-100: #d6f2ec;

  /* SOS — só emergência */
  --coral: #e4572e;
  --coral-bg: #fdeae2;

  /* Estados semânticos */
  --pass: #2e7d62;
  --pass-bg: #e3f3ec;
  --fail: #c2401c;
  --fail-bg: #fdeae2;
  --block: #d98c1f;
  --block-bg: #fdf0dc;
  --pending: #667572;
  --pending-bg: rgba(102, 117, 114, 0.12);
  --info: #189085;
  --info-bg: #d6f2ec;

  /* Texto */
  --text-primary: #14201e;
  --text-secondary: #4e5d5a;
  --text-tertiary: #667572;

  /* Layout */
  --radius: 16px;
  --radius-lg: 20px;
  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-sans: "Inter", "Segoe UI", system-ui, sans-serif;

  --grad-primary: linear-gradient(135deg, #0b3b36 0%, #12766e 100%);
  --grad-surface: radial-gradient(
    120% 120% at 50% 0%,
    rgba(18, 118, 110, 0.08),
    transparent 60%
  );
}
```

### Regras visuais

- Texto sobre accent: `--on-accent` (branco)
- CTAs e destaques: verde-petróleo; tags info: brand-200/100
- Cards: fundo sand/branco + borda `--border`
- Scoreboard “Taxa %”: pode usar `--grad-primary` no número
- Relatório é **light-first** (produto Zelita), não dark-first

---

## Google Fonts (head do HTML)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap"
  rel="stylesheet"
/>
```

---

## Estrutura HTML do Relatório

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatório de Testes Manuais — Zelita</title>
    <!-- Fonts + CSS inline com variáveis acima -->
  </head>
  <body>
    <div id="lightbox" onclick="closeLightbox()">
      <span id="lightbox-close">&#x2715;</span>
      <img
        id="lightbox-img"
        src=""
        alt="Evidência ampliada"
        onclick="event.stopPropagation()"
      />
    </div>

    <header class="topbar">
      <div class="topbar-brand">
        <div class="logo-mark" aria-hidden="true">
          <!-- símbolo Zelita ou inicial Z -->
        </div>
        <div>
          <h1>Zelita</h1>
          <span>Relatório de Testes Manuais · MVP</span>
        </div>
      </div>
      <div class="topbar-meta">
        <span class="badge-version">POP-QA-ZELITA-001</span>
      </div>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-tag">QA Report</div>
        <h2>Homologação Manual — MVP</h2>
        <p>
          Validação dos fluxos P0: auth OTP, pessoa cuidada, cartela, lembretes,
          PWA idoso e SOS.
        </p>
        <div class="hero-meta">
          <div class="hero-meta-item">
            <label>Projeto</label><span>Zelita</span>
          </div>
          <div class="hero-meta-item">
            <label>Plataforma</label><span>Web · Next.js App Router</span>
          </div>
          <div class="hero-meta-item">
            <label>Executor</label><span id="meta-executor">—</span>
          </div>
          <div class="hero-meta-item">
            <label>Data</label><span id="meta-data">—</span>
          </div>
          <div class="hero-meta-item">
            <label>Ambiente</label
            ><span id="meta-ambiente">Local (localhost:3000)</span>
          </div>
        </div>
      </div>
    </section>

    <main class="container">
      <!-- scoreboard, progress, flows, bugs, matrix — ver SKILL.md -->
    </main>

    <footer class="footer">
      Zelita · <strong>POP-QA-ZELITA-001</strong> · Marca light-first · Vitest +
      QA manual
    </footer>
  </body>
</html>
```

---

## JavaScript Obrigatório

```javascript
const testData = {
  auth: { total: 0, pass: 0, fail: 0, block: 0 },
  onboarding: { total: 0, pass: 0, fail: 0, block: 0 },
  meds: { total: 0, pass: 0, fail: 0, block: 0 },
  reminders: { total: 0, pass: 0, fail: 0, block: 0 },
  elder: { total: 0, pass: 0, fail: 0, block: 0 },
  sos: { total: 0, pass: 0, fail: 0, block: 0 },
  security: { total: 0, pass: 0, fail: 0, block: 0 },
};

// Funções: initScoreboard(), toggleFlow(id), openLightbox(src), closeLightbox()
// DOMContentLoaded → meta-executor, meta-data, initScoreboard()
```

Chaves de `testData` devem corresponder aos fluxos FL cobertos no relatório. Ajuste totais ao criar TCs.

---

## Status Badges

```html
<span class="status pass dot">Aprovado</span>
<span class="status fail dot">Reprovado</span>
<span class="status block dot">Bloqueado</span>
<span class="status pending dot">Pendente</span>
```

Estilo sugerido: pill com fundo semântico (`--pass-bg`, etc.) + ponto colorido (`.dot::before`).

---

## Evidências

**Caminho relativo no HTML:** `evidencias/tc03-cartela-fim-calculado.jpeg`

```html
<div
  class="evidence-item"
  onclick="openLightbox('evidencias/tc03-cartela-fim-calculado.jpeg')"
>
  <img
    src="evidencias/tc03-cartela-fim-calculado.jpeg"
    alt="TC-03 — Fim de cartela"
    onerror="this.parentElement.classList.add('missing');"
  />
  <div class="evidence-caption">TC-03 — Fim de cartela calculado</div>
</div>
```

| Padrão                               | Exemplo                           |
| ------------------------------------ | --------------------------------- |
| `tc[número]-[descricao-curta].[ext]` | `tc03-cartela-fim-calculado.jpeg` |
|                                      | `tc12-pwa-vinculo-sem-login.png`  |

Extensões: `.jpeg`, `.jpg`, `.png`, `.webp`

---

## Sincronização com PENDENCIAS.md

Ao aprovar TCs, marque o item equivalente em `docs/state/PENDENCIAS.md` (criar o arquivo se ainda não existir). Mapeamento típico da fatia 1:

| Tema                        | Pendência relacionada |
| --------------------------- | --------------------- |
| Auth OTP                    | FL-01                 |
| Care recipient / onboarding | FL-02                 |
| Cartela + cálculo de fim    | FL-03                 |
| Reminder job + WA sandbox   | FL-04                 |
| RLS entre contas            | FL-07                 |

---

## Checklist de Qualidade

- [ ] Paleta Zelita (petróleo/sand), não Surf/ByStartup
- [ ] Coral não usado como accent genérico
- [ ] Título e footer com nome Zelita · POP-QA-ZELITA-001
- [ ] Console sem erros JS
- [ ] Scoreboard e matriz coerentes com `testData`
- [ ] Acordeão e lightbox funcionais
- [ ] Relatório autocontido (CSS/JS inline)
