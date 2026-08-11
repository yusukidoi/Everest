import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { UsageLog } from "../src/domain/UsageLog.js";
import { UsageOutcome } from "../src/domain/UsageRecord.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceUsageService } from "../src/application/ResourceUsageService.js";

describe("resource interaction audit logging", () => {
  it("audits both allowed and denied attempts for the same passenger", () => {
    const { usage, log } = setup();

    usage.useResource("p-silver", "food-station");
    expect(() => usage.useResource("p-silver", "luxury-o2")).toThrow();

    expect(log.getAll()).toHaveLength(2);
    expect(log.listAllowed()).toHaveLength(1);
    expect(log.listDenied()).toHaveLength(1);

    const denied = log.listDenied()[0];
    expect(denied).toMatchObject({
      passengerId: "p-silver",
      resourceId: "luxury-o2",
      outcome: UsageOutcome.Denied,
      membershipLevelAtUse: MembershipLevel.Silver,
    });
    expect(denied?.reason).toMatch(/does not permit/i);
  });

  it("audits decommissioned-resource denials", () => {
    const { usage, log, resources } = setup();
    resources.decommissionResource("lead-1", "food-station");

    expect(() => usage.useResource("p-platinum", "food-station")).toThrow();

    expect(log.listDenied()).toHaveLength(1);
    expect(log.listDenied()[0]?.reason).toMatch(/decommissioned/i);
  });

  it("does not audit unknown passenger or resource lookups", () => {
    const { usage, log } = setup();

    expect(() => usage.useResource("missing", "food-station")).toThrow(/not found/i);
    expect(() => usage.useResource("p-silver", "missing")).toThrow(/not found/i);
    expect(log.getAll()).toHaveLength(0);
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
  return { usage, log, resources };
}
