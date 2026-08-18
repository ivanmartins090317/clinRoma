import { describe, expect, it } from "vitest";

import {
  canDragEntryToColumn,
  canTransitionEntryStatus,
  canTransitionOfferStatus,
} from "./waitlist-transitions";

describe("waitlist-transitions", () => {
  it("permite transições de entrada conforme regras", () => {
    expect(canTransitionEntryStatus("waiting", "offered")).toBe(true);
    expect(canTransitionEntryStatus("offered", "waiting")).toBe(true);
    expect(canTransitionEntryStatus("offered", "scheduled")).toBe(true);
    expect(canTransitionEntryStatus("waiting", "scheduled")).toBe(false);
  });

  it("restringe arraste entre colunas", () => {
    expect(canDragEntryToColumn("offered", "waiting")).toBe(true);
    expect(canDragEntryToColumn("waiting", "offered")).toBe(false);
    expect(canDragEntryToColumn("offered", "scheduled")).toBe(false);
  });

  it("permite transições de oferta apenas a partir de pendente", () => {
    expect(canTransitionOfferStatus("pending", "accepted")).toBe(true);
    expect(canTransitionOfferStatus("pending", "declined")).toBe(true);
    expect(canTransitionOfferStatus("accepted", "declined")).toBe(false);
  });
});
