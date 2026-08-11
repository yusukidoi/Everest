import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { DomainError } from "../src/domain/DomainError.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceDiscoveryService } from "../src/application/ResourceDiscoveryService.js";

describe("passenger tier management", () => {
  it("lets a crew lead upgrade a passenger membership", () => {
    const { passengers } = setup();
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    const updated = passengers.upgradePassenger(
      "lead-2",
      "p-1",
      MembershipLevel.Gold,
    );

    expect(updated.membershipLevel).toBe(MembershipLevel.Gold);
  });

  it("lets a crew lead downgrade a passenger membership", () => {
    const { passengers } = setup();
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Platinum);

    const updated = passengers.downgradePassenger(
      "lead-2",
      "p-1",
      MembershipLevel.Silver,
    );

    expect(updated.membershipLevel).toBe(MembershipLevel.Silver);
  });

  it("rejects upgrade when the target level is not higher", () => {
    const { passengers } = setup();
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Gold);

    expect(() =>
      passengers.upgradePassenger("lead-1", "p-1", MembershipLevel.Silver),
    ).toThrow(/upgrade requires a higher/i);
    expect(() =>
      passengers.upgradePassenger("lead-1", "p-1", MembershipLevel.Gold),
    ).toThrow(/upgrade requires a higher/i);
  });

  it("rejects downgrade when the target level is not lower", () => {
    const { passengers } = setup();
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    expect(() =>
      passengers.downgradePassenger("lead-1", "p-1", MembershipLevel.Gold),
    ).toThrow(/downgrade requires a lower/i);
  });

  it("rejects tier changes by non crew leads", () => {
    const { passengers } = setup();
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    expect(() =>
      passengers.changeMembershipLevel("hacker", "p-1", MembershipLevel.Gold),
    ).toThrow(DomainError);
    expect(() =>
      passengers.changeMembershipLevel("hacker", "p-1", MembershipLevel.Gold),
    ).toThrow(/only crew leads/i);
  });

  it("updates resource discovery after a tier change", () => {
    const { passengers, discovery, resources, crewLeads } = setup();
    resources.seedMissionInventory("lead-1");
    passengers.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    expect(discovery.listAccessibleResources("p-1")).toHaveLength(3);

    passengers.upgradePassenger("lead-1", "p-1", MembershipLevel.Platinum);
    expect(discovery.listAccessibleResources("p-1")).toHaveLength(7);
    expect(crewLeads.isFullyStaffed()).toBe(true);
  });
});

function setup() {
  const crewLeads = new CrewLeadRegistry();
  crewLeads.register("lead-1", "Aiko");
  crewLeads.register("lead-2", "Ben");
  crewLeads.register("lead-3", "Cara");

  const passengerRegistry = new PassengerRegistry();
  const passengers = new PassengerManagementService(crewLeads, passengerRegistry);
  const catalog = new ResourceCatalog();
  const resources = new ResourceManagementService(crewLeads, catalog);
  const discovery = new ResourceDiscoveryService(passengerRegistry, catalog);

  return { passengers, discovery, resources, crewLeads };
}
