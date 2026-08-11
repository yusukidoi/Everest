import { DomainError } from "../domain/DomainError.js";
import { canAccess } from "../domain/MembershipLevel.js";
import type { PassengerRegistry } from "../domain/PassengerRegistry.js";
import type { ResourceCatalog } from "../domain/ResourceCatalog.js";
import type { UsageLog } from "../domain/UsageLog.js";
import { UsageOutcome, type UsageRecord } from "../domain/UsageRecord.js";

/**
 * Validates membership in real time and audits every resource interaction.
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
      const reason = `Resource '${resourceId}' is decommissioned and cannot be used.`;
      this.auditDenied(passenger.id, resource.id, passenger.membershipLevel, usedAt, reason);
      throw new DomainError(reason);
    }

    if (!canAccess(passenger.membershipLevel, resource.minimumMembershipLevel)) {
      const reason = `Membership '${passenger.membershipLevel}' does not permit use of resource '${resourceId}' (requires '${resource.minimumMembershipLevel}').`;
      this.auditDenied(passenger.id, resource.id, passenger.membershipLevel, usedAt, reason);
      throw new DomainError(reason);
    }

    return this.usageLog.append({
      id: this.nextRecordId(),
      passengerId: passenger.id,
      resourceId: resource.id,
      membershipLevelAtUse: passenger.membershipLevel,
      usedAt,
      outcome: UsageOutcome.Allowed,
    });
  }

  private auditDenied(
    passengerId: string,
    resourceId: string,
    membershipLevelAtUse: UsageRecord["membershipLevelAtUse"],
    usedAt: Date,
    reason: string,
  ): void {
    this.usageLog.append({
      id: this.nextRecordId(),
      passengerId,
      resourceId,
      membershipLevelAtUse,
      usedAt,
      outcome: UsageOutcome.Denied,
      reason,
    });
  }

  private nextRecordId(): string {
    return `usage-${this.nextId++}`;
  }
}
