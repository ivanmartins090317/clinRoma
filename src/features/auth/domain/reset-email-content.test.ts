import { describe, expect, it } from "vitest";

import { buildResetEmailContent } from "@/features/auth/domain/reset-email-content";

const LINK = "https://clinroma.app/redefinir-senha#token=abc";

describe("buildResetEmailContent", () => {
  it("inclui o link nas duas versões", () => {
    const content = buildResetEmailContent({
      displayName: "Ana Souza",
      setPasswordUrl: LINK,
    });

    expect(content.subject).toContain("Redefinir senha");
    expect(content.text).toContain(LINK);
    expect(content.html).toContain(LINK);
  });

  it("escapa HTML do nome", () => {
    const content = buildResetEmailContent({
      displayName: '<script>alert("x")</script>',
      setPasswordUrl: LINK,
    });

    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
  });

  it("não expõe senha temporária", () => {
    const content = buildResetEmailContent({
      displayName: "Ana Souza",
      setPasswordUrl: LINK,
    });

    expect(content.text.toLowerCase()).not.toContain("senha temporária");
  });
});
