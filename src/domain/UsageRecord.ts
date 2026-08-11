import { MembershipLevel } from "./MembershipLevel.js";

export interface UsageRecord {
  readonly id: string;
  readonly passengerId: string;
  readonly resourceId: string;
  readonly membershipLevelAtUse: MembershipLevel;
  readonly usedAt: Date;
}
