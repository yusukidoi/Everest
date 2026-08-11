import { UsageOutcome, type UsageRecord } from "./UsageRecord.js";

/**
 * Append-only audit trail of resource interactions (allowed and denied).
 */
export class UsageLog {
  private readonly records: UsageRecord[] = [];

  append(record: UsageRecord): UsageRecord {
    this.records.push(record);
    return record;
  }

  getAll(): readonly UsageRecord[] {
    return [...this.records];
  }

  listByPassenger(passengerId: string): readonly UsageRecord[] {
    return this.records.filter((record) => record.passengerId === passengerId);
  }

  listByResource(resourceId: string): readonly UsageRecord[] {
    return this.records.filter((record) => record.resourceId === resourceId);
  }

  listAllowed(): readonly UsageRecord[] {
    return this.records.filter((record) => record.outcome === UsageOutcome.Allowed);
  }

  listDenied(): readonly UsageRecord[] {
    return this.records.filter((record) => record.outcome === UsageOutcome.Denied);
  }
}
