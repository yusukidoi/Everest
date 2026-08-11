import { DomainError } from "./DomainError.js";
import type { MembershipLevel } from "./MembershipLevel.js";
import type { Passenger } from "./Passenger.js";

/** In-mission passenger profile store (no authorization — callers gate access). */
export class PassengerRegistry {
  private readonly passengers = new Map<string, Passenger>();

  get count(): number {
    return this.passengers.size;
  }

  getById(id: string): Passenger {
    const passenger = this.passengers.get(id);
    if (!passenger) {
      throw new DomainError(`Passenger '${id}' was not found.`);
    }
    return passenger;
  }

  findById(id: string): Passenger | undefined {
    return this.passengers.get(id);
  }

  getAll(): readonly Passenger[] {
    return [...this.passengers.values()];
  }

  add(passenger: Passenger): Passenger {
    if (this.passengers.has(passenger.id)) {
      throw new DomainError(`Passenger '${passenger.id}' already exists.`);
    }
    this.passengers.set(passenger.id, passenger);
    return passenger;
  }

  update(passenger: Passenger): Passenger {
    if (!this.passengers.has(passenger.id)) {
      throw new DomainError(`Passenger '${passenger.id}' was not found.`);
    }
    this.passengers.set(passenger.id, passenger);
    return passenger;
  }

  remove(id: string): void {
    if (!this.passengers.delete(id)) {
      throw new DomainError(`Passenger '${id}' was not found.`);
    }
  }

  setMembershipLevel(id: string, membershipLevel: MembershipLevel): Passenger {
    const current = this.getById(id);
    return this.update({ ...current, membershipLevel });
  }
}
