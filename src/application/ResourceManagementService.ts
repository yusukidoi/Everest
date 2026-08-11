import type { CrewLeadRegistry } from "../domain/CrewLeadRegistry.js";
import { DomainError } from "../domain/DomainError.js";
import { MembershipLevel } from "../domain/MembershipLevel.js";
import type { Resource } from "../domain/Resource.js";
import { ResourceType } from "../domain/Resource.js";
import type { ResourceCatalog } from "../domain/ResourceCatalog.js";

export interface MissionResourceSeed {
  readonly id: string;
  readonly name: string;
  readonly type: ResourceType;
  readonly minimumMembershipLevel: MembershipLevel;
}

/** Default Spaceship X26 inventory categorized by minimum membership. */
export const MISSION_BASE_INVENTORY: readonly MissionResourceSeed[] = [
  {
    id: "food-station",
    name: "Food Supply Station",
    type: ResourceType.FoodStation,
    minimumMembershipLevel: MembershipLevel.Silver,
  },
  {
    id: "sleeping-pod",
    name: "Sleeping Pod",
    type: ResourceType.SleepingPod,
    minimumMembershipLevel: MembershipLevel.Silver,
  },
  {
    id: "basic-hygiene",
    name: "Basic Hygiene Pod",
    type: ResourceType.HygienePod,
    minimumMembershipLevel: MembershipLevel.Silver,
  },
  {
    id: "private-cabin",
    name: "Private Cabin",
    type: ResourceType.PrivateCabin,
    minimumMembershipLevel: MembershipLevel.Gold,
  },
  {
    id: "adv-medical",
    name: "Advanced Medical Bay",
    type: ResourceType.MedicalBay,
    minimumMembershipLevel: MembershipLevel.Gold,
  },
  {
    id: "luxury-o2",
    name: "Luxury Oxygen Pod",
    type: ResourceType.OxygenRefill,
    minimumMembershipLevel: MembershipLevel.Platinum,
  },
  {
    id: "vip-rec",
    name: "VIP Recreation Deck",
    type: ResourceType.RecreationDeck,
    minimumMembershipLevel: MembershipLevel.Platinum,
  },
];

/**
 * Crew Lead–only resource provisioning and inventory control.
 */
export class ResourceManagementService {
  constructor(
    private readonly crewLeads: CrewLeadRegistry,
    private readonly catalog: ResourceCatalog,
  ) {}

  provisionResource(
    actorCrewLeadId: string,
    id: string,
    name: string,
    type: ResourceType,
    minimumMembershipLevel: MembershipLevel,
  ): Resource {
    this.requireCrewLead(actorCrewLeadId);

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    if (!normalizedId) {
      throw new DomainError("Resource id must not be blank.");
    }
    if (!normalizedName) {
      throw new DomainError("Resource name must not be blank.");
    }

    return this.catalog.add({
      id: normalizedId,
      name: normalizedName,
      type,
      minimumMembershipLevel,
      decommissioned: false,
    });
  }

  decommissionResource(actorCrewLeadId: string, resourceId: string): Resource {
    this.requireCrewLead(actorCrewLeadId);
    return this.catalog.decommission(resourceId);
  }

  listResources(
    actorCrewLeadId: string,
    options: { includeDecommissioned?: boolean } = {},
  ): readonly Resource[] {
    this.requireCrewLead(actorCrewLeadId);
    return this.catalog.getAll(options);
  }

  seedMissionInventory(actorCrewLeadId: string): readonly Resource[] {
    this.requireCrewLead(actorCrewLeadId);

    if (this.catalog.count > 0) {
      throw new DomainError(
        "Mission inventory can only be seeded when the catalog is empty.",
      );
    }

    return MISSION_BASE_INVENTORY.map((seed) =>
      this.catalog.add({
        ...seed,
        decommissioned: false,
      }),
    );
  }

  private requireCrewLead(actorId: string): void {
    if (!this.crewLeads.isCrewLead(actorId)) {
      throw new DomainError(
        "Only crew leads are authorized to manage ship resources.",
      );
    }
  }
}
