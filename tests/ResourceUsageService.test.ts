import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { DomainError } from "../src/domain/DomainError.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceUsageService } from "../src/application/ResourceUsageService.js";
import { UsageLog } from "../src/domain/UsageLog.js";

describe("ResourceUsageService", () => {
  it("allows a passenger to use an accessible active resource", () => {
    const { usage } = setup();
    const at = new Date("2026-08-11T10:00:00.000Z");

    const record = usage.useResource("p-silver", "food-station", at);

    expect(record).toMatchObject({
      passengerId: "p-silver",
      resourceId: "food-station",
      membershipLevelAtUse: MembershipLevel.Silver,
      usedAt: at,
      outcome: "ALLOWED",
    });
    expect(record.id).toBeTruthy();
  });

  it("rejects use when membership is too low", () => {
    const { usage } = setup();

    expect(() => usage.useResource("p-silver", "luxury-o2")).toThrow(DomainError);
    expect(() => usage.useResource("p-silver", "luxury-o2")).toThrow(
      /membership .* does not permit/i,
    );
  });

  it("allows gold to use silver-minimum resources via inheritance", () => {
    const { usage } = setup();
    const record = usage.useResource("p-gold", "sleeping-pod");
    expect(record.resourceId).toBe("sleeping-pod");
  });

  it("rejects use of a decommissioned resource", () => {
    const { usage, resources } = setup();
    resources.decommissionResource("lead-1", "food-station");

    expect(() => usage.useResource("p-platinum", "food-station")).toThrow(
      /decommissioned/i,
    );
  });

  it("rejects unknown passenger or resource", () => {
    const { usage } = setup();
    expect(() => usage.useResource("missing", "food-station")).toThrow(/not found/i);
    expect(() => usage.useResource("p-silver", "missing")).toThrow(/not found/i);
  });

  it("records each successful use in the usage log", () => {
    const { usage, log } = setup();
    usage.useResource("p-gold", "food-station");
    usage.useResource("p-gold", "adv-medical");

    expect(log.listAllowed()).toHaveLength(2);
    expect(log.listByPassenger("p-gold")).toHaveLength(2);
  });
});

function setup() {
  const crewLeads = new CrewLeadRegistry();
  crewLeads.register("lead-1", "Aiko");
  crewLeads.register("lead-2", "Ben");
  crewLeads.register("lead-3", "Cara");

  const passengers = new PassengerRegistry();
  const passengerService = new PassengerManagementService(crewLeads, passengers);
  passengerService.createPassenger("lead-1", "p-silver", "Yuri", MembershipLevel.Silver);
  passengerService.createPassenger("lead-1", "p-gold", "Mika", MembershipLevel.Gold);
  passengerService.createPassenger(
    "lead-1",
    "p-platinum",
    "Nova",
    MembershipLevel.Platinum,
  );

  const catalog = new ResourceCatalog();
  const resources = new ResourceManagementService(crewLeads, catalog);
  resources.seedMissionInventory("lead-1");

  const log = new UsageLog();
  const usage = new ResourceUsageService(passengers, catalog, log);
  return { usage, log, resources, passengers, catalog, crewLeads };
}
