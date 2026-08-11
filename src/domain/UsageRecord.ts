import { MembershipLevel } from "./MembershipLevel.js";

export enum UsageOutcome {
  Allowed = "ALLOWED",
  Denied = "DENIED",
}

export interface UsageRecord {
  readonly id: string;
  readonly passengerId: string;
  readonly resourceId: string;
  readonly membershipLevelAtUse: MembershipLevel;
  readonly usedAt: Date;
  readonly outcome: UsageOutcome;
  readonly reason?: string;
}
