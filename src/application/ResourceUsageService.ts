import { DomainError } from "../domain/DomainError.js";
import { canAccess } from "../domain/MembershipLevel.js";
import type { PassengerRegistry } from "../domain/PassengerRegistry.js";
import type { ResourceCatalog } from "../domain/ResourceCatalog.js";
import type { UsageLog } from "../domain/UsageLog.js";
import type { UsageRecord } from "../domain/UsageRecord.js";

/**
 * Validates membership in real time, then records successful resource use.
 */
export class ResourceUsageService {
  private nextId = 1;

  constructor(
    private readonly passengers: PassengerRegistry,
    private readonly catalog: ResourceCatalog,
    private readonly usageLog: UsageLog,
  ) {}

  useResource(
    passengerId: string,
    resourceId: string,
    usedAt: Date = new Date(),
  ): UsageRecord {
    const passenger = this.passengers.getById(passengerId);
    const resource = this.catalog.getById(resourceId);

    if (resource.decommissioned) {
      throw new DomainError(
        `Resource '${resourceId}' is decommissioned and cannot be used.`,
      );
    }

    if (!canAccess(passenger.membershipLevel, resource.minimumMembershipLevel)) {
      throw new DomainError(
        `Membership '${passenger.membershipLevel}' does not permit use of resource '${resourceId}' (requires '${resource.minimumMembershipLevel}').`,
      );
    }

    return this.usageLog.append({
      id: `usage-${this.nextId++}`,
      passengerId: passenger.id,
      resourceId: resource.id,
      membershipLevelAtUse: passenger.membershipLevel,
      usedAt,
    });
  }
}
