import type { CrewLeadRegistry } from "../domain/CrewLeadRegistry.js";
import { DomainError } from "../domain/DomainError.js";
import type { MembershipLevel } from "../domain/MembershipLevel.js";
import type { Passenger } from "../domain/Passenger.js";
import type { PassengerRegistry } from "../domain/PassengerRegistry.js";

/**
 * Crew Lead–only passenger profile administration.
 */
export class PassengerManagementService {
  constructor(
    private readonly crewLeads: CrewLeadRegistry,
    private readonly passengers: PassengerRegistry,
  ) {}

  createPassenger(
    actorCrewLeadId: string,
    id: string,
    name: string,
    membershipLevel: MembershipLevel,
  ): Passenger {
    this.requireCrewLead(actorCrewLeadId);

    const normalizedId = id.trim();
    const normalizedName = name.trim();
    if (!normalizedId) {
      throw new DomainError("Passenger id must not be blank.");
    }
    if (!normalizedName) {
      throw new DomainError("Passenger name must not be blank.");
    }

    return this.passengers.add({
      id: normalizedId,
      name: normalizedName,
      membershipLevel,
    });
  }

  renamePassenger(
    actorCrewLeadId: string,
    passengerId: string,
    newName: string,
  ): Passenger {
    this.requireCrewLead(actorCrewLeadId);

    const normalizedName = newName.trim();
    if (!normalizedName) {
      throw new DomainError("Passenger name must not be blank.");
    }

    const current = this.passengers.getById(passengerId);
    return this.passengers.update({ ...current, name: normalizedName });
  }

  removePassenger(actorCrewLeadId: string, passengerId: string): void {
    this.requireCrewLead(actorCrewLeadId);
    this.passengers.remove(passengerId);
  }

  listPassengers(actorCrewLeadId: string): readonly Passenger[] {
    this.requireCrewLead(actorCrewLeadId);
    return this.passengers.getAll();
  }

  getPassenger(passengerId: string): Passenger {
    return this.passengers.getById(passengerId);
  }

  findPassenger(passengerId: string): Passenger | undefined {
    return this.passengers.findById(passengerId);
  }

  private requireCrewLead(actorId: string): void {
    if (!this.crewLeads.isCrewLead(actorId)) {
      throw new DomainError(
        "Only crew leads are authorized to manage passenger profiles.",
      );
    }
  }
}
