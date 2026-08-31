import { describe, expect, it } from "vitest";

import { buildInviteEmailContent } from "@/features/team/domain/invite-email-content";

const LINK = "https://clinroma.app/auth/recovery?token=abc";

describe("buildInviteEmailContent", () => {
  it("usa o rótulo do papel em pt-BR", () => {
    const content = buildInviteEmailContent({
      displayName: "Ana Souza",
      role: "room_assistant",
      setPasswordUrl: LINK,
    });

    expect(content.subject).toContain("Clínica Neo Roma");
    expect(content.text).toContain("Auxiliar de sala");
    expect(content.html).toContain("Auxiliar de sala");
  });

  it("inclui o link de definição de senha nas duas versões", () => {
    const content = buildInviteEmailContent({
      displayName: "Ana Souza",
      role: "reception",
      setPasswordUrl: LINK,
    });

    expect(content.text).toContain(LINK);
    expect(content.html).toContain(LINK);
  });

  it("escapa HTML do nome do colaborador", () => {
    const content = buildInviteEmailContent({
      displayName: '<script>alert("x")</script>',
      role: "viewer",
      setPasswordUrl: LINK,
    });

    expect(content.html).not.toContain("<script>");
    expect(content.html).toContain("&lt;script&gt;");
  });

  it("não expõe senha nem token fora do link", () => {
    const content = buildInviteEmailContent({
      displayName: "Ana Souza",
      role: "dentist",
      setPasswordUrl: LINK,
    });

    expect(content.text.toLowerCase()).not.toContain("senha temporária");
  });
});
