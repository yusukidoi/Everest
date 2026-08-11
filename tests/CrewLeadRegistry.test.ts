import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { DomainError } from "../src/domain/DomainError.js";

describe("CrewLeadRegistry", () => {
  it("starts empty and reports required headcount of 3", () => {
    const registry = new CrewLeadRegistry();
    expect(registry.count).toBe(0);
    expect(CrewLeadRegistry.REQUIRED_COUNT).toBe(3);
    expect(registry.isFullyStaffed()).toBe(false);
  });

  it("registers up to exactly three crew leads", () => {
    const registry = new CrewLeadRegistry();
    registry.register("lead-1", "Aiko");
    registry.register("lead-2", "Ben");
    registry.register("lead-3", "Cara");

    expect(registry.count).toBe(3);
    expect(registry.isFullyStaffed()).toBe(true);
    expect(registry.isCrewLead("lead-2")).toBe(true);
    expect(registry.getAll().map((l) => l.id)).toEqual([
      "lead-1",
      "lead-2",
      "lead-3",
    ]);
  });

  it("rejects a fourth crew lead", () => {
    const registry = fullyStaffedRegistry();
    expect(() => registry.register("lead-4", "Dana")).toThrow(DomainError);
    expect(() => registry.register("lead-4", "Dana")).toThrow(
      /exactly three crew leads/i,
    );
    expect(registry.count).toBe(3);
  });

  it("rejects duplicate crew lead ids", () => {
    const registry = new CrewLeadRegistry();
    registry.register("lead-1", "Aiko");
    expect(() => registry.register("lead-1", "Other")).toThrow(DomainError);
    expect(() => registry.register("lead-1", "Other")).toThrow(/already registered/i);
  });

  it("rejects blank ids or names", () => {
    const registry = new CrewLeadRegistry();
    expect(() => registry.register("", "Aiko")).toThrow(DomainError);
    expect(() => registry.register("lead-1", "   ")).toThrow(DomainError);
  });

  it("allows removing a lead then registering a replacement", () => {
    const registry = fullyStaffedRegistry();
    registry.remove("lead-2");
    expect(registry.count).toBe(2);
    expect(registry.isCrewLead("lead-2")).toBe(false);

    registry.register("lead-4", "Dana");
    expect(registry.isFullyStaffed()).toBe(true);
    expect(registry.isCrewLead("lead-4")).toBe(true);
  });

  it("rejects removing an unknown lead", () => {
    const registry = fullyStaffedRegistry();
    expect(() => registry.remove("unknown")).toThrow(DomainError);
  });
});

function fullyStaffedRegistry(): CrewLeadRegistry {
  const registry = new CrewLeadRegistry();
  registry.register("lead-1", "Aiko");
  registry.register("lead-2", "Ben");
  registry.register("lead-3", "Cara");
  return registry;
}
