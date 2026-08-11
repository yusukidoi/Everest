import type { CrewLeadRegistry } from "../domain/CrewLeadRegistry.js";
import { DomainError } from "../domain/DomainError.js";
import { MembershipLevel } from "../domain/MembershipLevel.js";
import type { PassengerRegistry } from "../domain/PassengerRegistry.js";
import type { ResourceCatalog } from "../domain/ResourceCatalog.js";
import type { UsageLog } from "../domain/UsageLog.js";
import { UsageOutcome, type UsageRecord } from "../domain/UsageRecord.js";

export interface MembershipUsageSummary {
  readonly membershipLevel: MembershipLevel;
  readonly passengerCount: number;
  readonly allowedUsageCount: number;
}

export interface ResourceDemandSummary {
  readonly resourceId: string;
  readonly resourceName: string;
  readonly allowedUsageCount: number;
}

/**
 * Personal history for passengers plus Crew Lead ship-wide insights.
 */
export class ReportingService {
  constructor(
    private readonly crewLeads: CrewLeadRegistry,
    private readonly passengers: PassengerRegistry,
    private readonly catalog: ResourceCatalog,
    private readonly usageLog: UsageLog,
  ) {}

  getPersonalHistory(
    passengerId: string,
    options: { includeDenied?: boolean } = {},
  ): readonly UsageRecord[] {
    // Ensures the passenger exists before exposing history.
    this.passengers.getById(passengerId);

    const includeDenied = options.includeDenied ?? false;
    return this.usageLog
      .listByPassenger(passengerId)
      .filter(
        (record) => includeDenied || record.outcome === UsageOutcome.Allowed,
      );
  }

  getUsageByMembershipLevel(actorCrewLeadId: string): readonly MembershipUsageSummary[] {
    this.requireCrewLead(actorCrewLeadId);

    const levels = [
      MembershipLevel.Silver,
      MembershipLevel.Gold,
      MembershipLevel.Platinum,
    ];

    return levels.map((membershipLevel) => {
      const passengersAtLevel = this.passengers
        .getAll()
        .filter((passenger) => passenger.membershipLevel === membershipLevel);

      const passengerIds = new Set(passengersAtLevel.map((passenger) => passenger.id));
      const allowedUsageCount = this.usageLog
        .listAllowed()
        .filter((record) => passengerIds.has(record.passengerId)).length;

      return {
        membershipLevel,
        passengerCount: passengersAtLevel.length,
        allowedUsageCount,
      };
    });
  }

  getHighDemandResources(
    actorCrewLeadId: string,
    options: { limit?: number } = {},
  ): readonly ResourceDemandSummary[] {
    this.requireCrewLead(actorCrewLeadId);

    const counts = new Map<string, number>();
    for (const record of this.usageLog.listAllowed()) {
      counts.set(record.resourceId, (counts.get(record.resourceId) ?? 0) + 1);
    }

    const ranked = [...counts.entries()]
      .map(([resourceId, allowedUsageCount]) => {
        const resource = this.catalog.findById(resourceId);
        return {
          resourceId,
          resourceName: resource?.name ?? resourceId,
          allowedUsageCount,
        };
      })
      .sort((a, b) => {
        if (b.allowedUsageCount !== a.allowedUsageCount) {
          return b.allowedUsageCount - a.allowedUsageCount;
        }
        return a.resourceId.localeCompare(b.resourceId);
      });

    const limit = options.limit;
    if (limit === undefined) {
      return ranked;
    }
    return ranked.slice(0, limit);
  }

  private requireCrewLead(actorId: string): void {
    if (!this.crewLeads.isCrewLead(actorId)) {
      throw new DomainError(
        "Only crew leads are authorized to view ship-wide usage reports.",
      );
    }
  }
}
