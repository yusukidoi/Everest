/** Spaceship X26 PRMS — public entry (wired as features land). */
export const APP_NAME = "Spaceship X26 PRMS";

export {
  MembershipLevel,
  canAccess,
  compareLevels,
  inheritsFrom,
} from "./domain/MembershipLevel.js";

export { DomainError } from "./domain/DomainError.js";
export { CrewLeadRegistry } from "./domain/CrewLeadRegistry.js";
export type { CrewLead } from "./domain/CrewLeadRegistry.js";
