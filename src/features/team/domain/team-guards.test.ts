import { describe, expect, it } from "vitest";

import {
  canManageTeam,
  describeWriteFailure,
  isManageableRole,
  isSelfMutation,
  refuseTeamMutation,
  TEAM_COPY,
  wouldRemoveLastAdmin,
  type CollaboratorState,
} from "@/features/team/domain/team-guards";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const OTHER_ADMIN = "22222222-2222-4222-8222-222222222222";
const DENTIST = "33333333-3333-4333-8333-333333333333";
const INACTIVE_ADMIN = "44444444-4444-4444-8444-444444444444";

const SINGLE_ADMIN: CollaboratorState[] = [
  { id: ADMIN, role: "admin", active: true },
  { id: DENTIST, role: "dentist", active: true },
  { id: INACTIVE_ADMIN, role: "admin", active: false },
];

const TWO_ADMINS: CollaboratorState[] = [
  ...SINGLE_ADMIN,
  { id: OTHER_ADMIN, role: "admin", active: true },
];

describe("canManageTeam", () => {
  it("libera só admin", () => {
    expect(canManageTeam("admin")).toBe(true);
    expect(canManageTeam("dentist")).toBe(false);
    expect(canManageTeam("reception")).toBe(false);
    expect(canManageTeam("room_assistant")).toBe(false);
    expect(canManageTeam("viewer")).toBe(false);
  });
});

describe("isManageableRole", () => {
  it("aceita os cinco papéis do enum e recusa o resto", () => {
    expect(isManageableRole("admin")).toBe(true);
    expect(isManageableRole("room_assistant")).toBe(true);
    expect(isManageableRole("owner")).toBe(false);
    expect(isManageableRole("")).toBe(false);
  });
});

describe("isSelfMutation", () => {
  it("detecta ação sobre o próprio perfil", () => {
    expect(isSelfMutation(ADMIN, ADMIN)).toBe(true);
    expect(isSelfMutation(ADMIN, DENTIST)).toBe(false);
  });
});

describe("wouldRemoveLastAdmin", () => {
  it("bloqueia rebaixar o único admin ativo", () => {
    expect(
      wouldRemoveLastAdmin(SINGLE_ADMIN, {
        actorId: OTHER_ADMIN,
        targetId: ADMIN,
        nextRole: "reception",
      }),
    ).toBe(true);
  });

  it("bloqueia desativar o único admin ativo", () => {
    expect(
      wouldRemoveLastAdmin(SINGLE_ADMIN, {
        actorId: OTHER_ADMIN,
        targetId: ADMIN,
        nextActive: false,
      }),
    ).toBe(true);
  });

  it("admin inativo não conta como cobertura", () => {
    const withoutOtherAdmins = SINGLE_ADMIN.filter(
      (item) => item.id !== INACTIVE_ADMIN,
    );

    expect(
      wouldRemoveLastAdmin([...withoutOtherAdmins], {
        actorId: OTHER_ADMIN,
        targetId: ADMIN,
        nextRole: "viewer",
      }),
    ).toBe(true);
  });

  it("libera quando existe outro admin ativo", () => {
    expect(
      wouldRemoveLastAdmin(TWO_ADMINS, {
        actorId: OTHER_ADMIN,
        targetId: ADMIN,
        nextRole: "viewer",
      }),
    ).toBe(false);
  });

  it("não bloqueia mudança que mantém o papel admin ativo", () => {
    expect(
      wouldRemoveLastAdmin(SINGLE_ADMIN, {
        actorId: OTHER_ADMIN,
        targetId: ADMIN,
        nextRole: "admin",
      }),
    ).toBe(false);
  });

  it("ignora alvo que não é admin ativo", () => {
    expect(
      wouldRemoveLastAdmin(SINGLE_ADMIN, {
        actorId: ADMIN,
        targetId: DENTIST,
        nextActive: false,
      }),
    ).toBe(false);
    expect(
      wouldRemoveLastAdmin(SINGLE_ADMIN, {
        actorId: ADMIN,
        targetId: INACTIVE_ADMIN,
        nextRole: "viewer",
      }),
    ).toBe(false);
  });
});

describe("refuseTeamMutation", () => {
  it("recusa papel sem permissão", () => {
    expect(
      refuseTeamMutation("reception", SINGLE_ADMIN, {
        actorId: DENTIST,
        targetId: ADMIN,
        nextRole: "viewer",
      }),
    ).toBe(TEAM_COPY.noPermission);
  });

  it("recusa alteração do próprio acesso", () => {
    expect(
      refuseTeamMutation("admin", SINGLE_ADMIN, {
        actorId: ADMIN,
        targetId: ADMIN,
        nextRole: "viewer",
      }),
    ).toBe(TEAM_COPY.selfMutation);
  });

  it("recusa alvo inexistente", () => {
    expect(
      refuseTeamMutation("admin", SINGLE_ADMIN, {
        actorId: ADMIN,
        targetId: "55555555-5555-4555-8555-555555555555",
        nextRole: "viewer",
      }),
    ).toBe(TEAM_COPY.targetNotFound);
  });

  it("recusa deixar a clínica sem admin ativo", () => {
    expect(
      refuseTeamMutation("admin", TWO_ADMINS, {
        actorId: ADMIN,
        targetId: OTHER_ADMIN,
        nextActive: false,
      }),
    ).toBeNull();

    expect(
      refuseTeamMutation("admin", SINGLE_ADMIN, {
        actorId: DENTIST,
        targetId: ADMIN,
        nextActive: false,
      }),
    ).toBe(TEAM_COPY.lastAdmin);
  });

  it("libera mutação válida", () => {
    expect(
      refuseTeamMutation("admin", SINGLE_ADMIN, {
        actorId: ADMIN,
        targetId: DENTIST,
        nextRole: "reception",
      }),
    ).toBeNull();
  });
});

describe("describeWriteFailure", () => {
  it("reconhece as travas do trigger", () => {
    expect(
      describeWriteFailure(
        "A clínica precisa de pelo menos um administrador ativo",
      ),
    ).toBe(TEAM_COPY.lastAdmin);
    expect(
      describeWriteFailure("Você não pode alterar seu próprio papel ou acesso"),
    ).toBe(TEAM_COPY.selfMutation);
  });

  it("reconhece recusa de permissão e de RLS", () => {
    expect(describeWriteFailure("permission denied for table profiles")).toBe(
      TEAM_COPY.writeDenied,
    );
    expect(
      describeWriteFailure(
        'new row violates row-level security policy for table "profiles"',
      ),
    ).toBe(TEAM_COPY.writeDenied);
  });

  it("cai em mensagem genérica quando não reconhece", () => {
    expect(describeWriteFailure("timeout")).toBe(TEAM_COPY.writeFailed);
    expect(describeWriteFailure(null)).toBe(TEAM_COPY.writeFailed);
    expect(describeWriteFailure()).toBe(TEAM_COPY.writeFailed);
  });
});
