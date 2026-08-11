import { DomainError } from "./DomainError.js";

export interface CrewLead {
  readonly id: string;
  readonly name: string;
}

/**
 * Enforces the ship rule: system integrity is maintained by exactly three Crew Leads.
 */
export class CrewLeadRegistry {
  static readonly REQUIRED_COUNT = 3;

  private readonly leads = new Map<string, CrewLead>();

  get count(): number {
    return this.leads.size;
  }

  isFullyStaffed(): boolean {
    return this.count === CrewLeadRegistry.REQUIRED_COUNT;
  }

  isCrewLead(id: string): boolean {
    return this.leads.has(id);
  }

  getAll(): readonly CrewLead[] {
    return [...this.leads.values()];
  }

  register(id: string, name: string): CrewLead {
    const normalizedId = id.trim();
    const normalizedName = name.trim();

    if (!normalizedId) {
      throw new DomainError("Crew lead id must not be blank.");
    }
    if (!normalizedName) {
      throw new DomainError("Crew lead name must not be blank.");
    }
    if (this.leads.has(normalizedId)) {
      throw new DomainError(`Crew lead '${normalizedId}' is already registered.`);
    }
    if (this.count >= CrewLeadRegistry.REQUIRED_COUNT) {
      throw new DomainError(
        `Cannot register more than exactly three crew leads (limit ${CrewLeadRegistry.REQUIRED_COUNT}).`,
      );
    }

    const lead: CrewLead = { id: normalizedId, name: normalizedName };
    this.leads.set(normalizedId, lead);
    return lead;
  }

  remove(id: string): void {
    if (!this.leads.delete(id)) {
      throw new DomainError(`Crew lead '${id}' is not registered.`);
    }
  }
}
