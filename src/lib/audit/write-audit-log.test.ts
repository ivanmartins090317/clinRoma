import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

import { writeAuditLog } from "@/lib/audit/write-audit-log";

describe("writeAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });
  });

  it("registra entrada com ator autenticado", async () => {
    mockSingle.mockResolvedValue({ data: { id: "audit-1" }, error: null });

    const result = await writeAuditLog({
      action: "read",
      entityType: "medical_records",
      entityId: "record-1",
      metadata: { source: "test" },
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe("audit-1");
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: "user-1",
      action: "read",
      entity_type: "medical_records",
      entity_id: "record-1",
      metadata: { source: "test" },
    });
  });

  it("retorna erro quando insert falha", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    const result = await writeAuditLog({
      action: "write",
      entityType: "patients",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("permission denied");
  });
});
