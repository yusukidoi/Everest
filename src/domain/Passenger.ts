import { MembershipLevel } from "./MembershipLevel.js";

export interface Passenger {
  readonly id: string;
  readonly name: string;
  readonly membershipLevel: MembershipLevel;
}
