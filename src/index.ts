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

export type { Passenger } from "./domain/Passenger.js";
export { PassengerRegistry } from "./domain/PassengerRegistry.js";
export { PassengerManagementService } from "./application/PassengerManagementService.js";

export type { Resource } from "./domain/Resource.js";
export { ResourceType } from "./domain/Resource.js";
export { ResourceCatalog } from "./domain/ResourceCatalog.js";
export {
  ResourceManagementService,
  MISSION_BASE_INVENTORY,
} from "./application/ResourceManagementService.js";
export type { MissionResourceSeed } from "./application/ResourceManagementService.js";
export { ResourceDiscoveryService } from "./application/ResourceDiscoveryService.js";

export type { UsageRecord } from "./domain/UsageRecord.js";
export { UsageOutcome } from "./domain/UsageRecord.js";
export { UsageLog } from "./domain/UsageLog.js";
export { ResourceUsageService } from "./application/ResourceUsageService.js";
