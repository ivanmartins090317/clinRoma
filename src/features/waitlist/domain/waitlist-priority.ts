import { WAITLIST_COLORS, type WaitlistPriorityColor } from "@/types/clinroma";

export function compareWaitlistPriority(
  a: WaitlistPriorityColor,
  b: WaitlistPriorityColor,
): number {
  return WAITLIST_COLORS[a].order - WAITLIST_COLORS[b].order;
}

export function sortByWaitlistPriority<
  T extends { priority: WaitlistPriorityColor },
>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const priorityDiff = compareWaitlistPriority(left.priority, right.priority);

    return priorityDiff;
  });
}

export function getWaitlistPriorityLabel(
  priority: WaitlistPriorityColor,
): string {
  return WAITLIST_COLORS[priority].label;
}
