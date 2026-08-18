export type WaitlistEntryStatus =
  "waiting" | "offered" | "scheduled" | "cancelled" | "expired";

export type SlotOfferStatus = "pending" | "accepted" | "declined" | "expired";

export type WaitlistDragTarget = "waiting" | "offered" | "scheduled";

const ENTRY_TRANSITIONS: Record<WaitlistEntryStatus, WaitlistEntryStatus[]> = {
  waiting: ["offered", "cancelled"],
  offered: ["waiting", "scheduled", "cancelled"],
  scheduled: [],
  cancelled: [],
  expired: [],
};

export function canTransitionEntryStatus(
  from: WaitlistEntryStatus,
  to: WaitlistEntryStatus,
): boolean {
  return ENTRY_TRANSITIONS[from].includes(to);
}

export function canDragEntryToColumn(
  from: WaitlistEntryStatus,
  targetColumn: WaitlistDragTarget,
): boolean {
  if (targetColumn === "scheduled") {
    return false;
  }

  if (from === "offered" && targetColumn === "waiting") {
    return true;
  }

  return false;
}

export function canTransitionOfferStatus(
  from: SlotOfferStatus,
  to: SlotOfferStatus,
): boolean {
  if (from !== "pending") {
    return false;
  }

  return to === "accepted" || to === "declined" || to === "expired";
}
