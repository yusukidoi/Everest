/**
 * Passenger membership tiers. Higher tiers inherit all lower-tier access.
 * Spec: Silver ⊂ Gold ⊂ Platinum.
 */
export enum MembershipLevel {
  Silver = "SILVER",
  Gold = "GOLD",
  Platinum = "PLATINUM",
}

const LEVEL_RANK: Record<MembershipLevel, number> = {
  [MembershipLevel.Silver]: 1,
  [MembershipLevel.Gold]: 2,
  [MembershipLevel.Platinum]: 3,
};

/** Negative if a < b, zero if equal, positive if a > b. */
export function compareLevels(a: MembershipLevel, b: MembershipLevel): number {
  return LEVEL_RANK[a] - LEVEL_RANK[b];
}

/**
 * True when `passengerLevel` includes all privileges of `requiredLevel`
 * (same tier or higher via inheritance).
 */
export function inheritsFrom(
  passengerLevel: MembershipLevel,
  requiredLevel: MembershipLevel,
): boolean {
  return compareLevels(passengerLevel, requiredLevel) >= 0;
}

/** Alias for clarity at resource-access call sites. */
export function canAccess(
  passengerLevel: MembershipLevel,
  resourceMinimumLevel: MembershipLevel,
): boolean {
  return inheritsFrom(passengerLevel, resourceMinimumLevel);
}
