import { describe, expect, it } from "vitest";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import {
  createPrmsSystem,
  seedDemoMission,
} from "../src/infrastructure/PrmsSystem.js";

describe("demo PRMS system wiring", () => {
  it("seeds crew leads, inventory, and sample passengers", () => {
    const system = createPrmsSystem();
    seedDemoMission(system);

    expect(system.crewLeads.isFullyStaffed()).toBe(true);
    expect(system.catalog.getAll()).toHaveLength(7);
    expect(system.passengers.getAll()).toHaveLength(3);
  });

  it("supports an end-to-end passenger journey", () => {
    const system = createPrmsSystem();
    seedDemoMission(system);

    expect(system.discovery.listAccessibleResources("p-silver")).toHaveLength(3);
    system.usage.useResource("p-silver", "food-station");
    expect(() => system.usage.useResource("p-silver", "luxury-o2")).toThrow();

    system.passengerManagement.upgradePassenger(
      "lead-1",
      "p-silver",
      MembershipLevel.Gold,
    );
    system.usage.useResource("p-silver", "food-station");
    system.usage.useResource("p-silver", "adv-medical");

    expect(
      system.reporting.getPersonalHistory("p-silver", { includeDenied: true }),
    ).toHaveLength(4);
    expect(system.reporting.getHighDemandResources("lead-1")[0]).toMatchObject({
      resourceId: "food-station",
      allowedUsageCount: 2,
    });
  });
});
