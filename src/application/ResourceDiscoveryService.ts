import { canAccess } from "../domain/MembershipLevel.js";
import type { PassengerRegistry } from "../domain/PassengerRegistry.js";
import type { Resource } from "../domain/Resource.js";
import type { ResourceCatalog } from "../domain/ResourceCatalog.js";

/**
 * Passenger-facing resource discovery filtered by membership inheritance.
 */
export class ResourceDiscoveryService {
  constructor(
    private readonly passengers: PassengerRegistry,
    private readonly catalog: ResourceCatalog,
  ) {}

  listAccessibleResources(passengerId: string): readonly Resource[] {
    const passenger = this.passengers.getById(passengerId);

    return this.catalog
      .getAll()
      .filter((resource) =>
        canAccess(passenger.membershipLevel, resource.minimumMembershipLevel),
      );
  }
}
