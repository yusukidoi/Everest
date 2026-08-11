import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { DomainError } from "../src/domain/DomainError.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceType } from "../src/domain/Resource.js";

describe("ResourceManagementService", () => {
  it("lets a crew lead provision a resource with a minimum membership", () => {
    const { service } = setup();

    const resource = service.provisionResource(
      "lead-1",
      "food-1",
      "Food Supply Station A",
      ResourceType.FoodStation,
      MembershipLevel.Silver,
    );

    expect(resource).toEqual({
      id: "food-1",
      name: "Food Supply Station A",
      type: ResourceType.FoodStation,
      minimumMembershipLevel: MembershipLevel.Silver,
      decommissioned: false,
    });
  });

  it("rejects provisioning by a non crew lead", () => {
    const { service } = setup();

    expect(() =>
      service.provisionResource(
        "outsider",
        "food-1",
        "Food Supply Station A",
        ResourceType.FoodStation,
        MembershipLevel.Silver,
      ),
    ).toThrow(/only crew leads/i);
  });

  it("rejects duplicate resource ids", () => {
    const { service } = setup();
    service.provisionResource(
      "lead-1",
      "food-1",
      "Food A",
      ResourceType.FoodStation,
      MembershipLevel.Silver,
    );

    expect(() =>
      service.provisionResource(
        "lead-2",
        "food-1",
        "Food B",
        ResourceType.FoodStation,
        MembershipLevel.Silver,
      ),
    ).toThrow(/already exists/i);
  });

  it("lets a crew lead decommission a resource", () => {
    const { service } = setup();
    service.provisionResource(
      "lead-1",
      "oxy-1",
      "Luxury O2 Pod",
      ResourceType.OxygenRefill,
      MembershipLevel.Platinum,
    );

    const retired = service.decommissionResource("lead-3", "oxy-1");
    expect(retired.decommissioned).toBe(true);
  });

  it("lists only active resources by default", () => {
    const { service } = setup();
    service.provisionResource(
      "lead-1",
      "sleep-1",
      "Sleeping Pod 1",
      ResourceType.SleepingPod,
      MembershipLevel.Silver,
    );
    service.provisionResource(
      "lead-1",
      "med-1",
      "Advanced Medical Bay",
      ResourceType.MedicalBay,
      MembershipLevel.Gold,
    );
    service.decommissionResource("lead-1", "sleep-1");

    expect(service.listResources("lead-2").map((r) => r.id)).toEqual(["med-1"]);
    expect(service.listResources("lead-2", { includeDecommissioned: true })).toHaveLength(
      2,
    );
  });

  it("seeds the mission base inventory with expected minimum levels", () => {
    const { service } = setup();
    service.seedMissionInventory("lead-1");

    const byName = Object.fromEntries(
      service.listResources("lead-1").map((r) => [r.name, r.minimumMembershipLevel]),
    );

    expect(byName["Food Supply Station"]).toBe(MembershipLevel.Silver);
    expect(byName["Sleeping Pod"]).toBe(MembershipLevel.Silver);
    expect(byName["Basic Hygiene Pod"]).toBe(MembershipLevel.Silver);
    expect(byName["Private Cabin"]).toBe(MembershipLevel.Gold);
    expect(byName["Advanced Medical Bay"]).toBe(MembershipLevel.Gold);
    expect(byName["Luxury Oxygen Pod"]).toBe(MembershipLevel.Platinum);
    expect(byName["VIP Recreation Deck"]).toBe(MembershipLevel.Platinum);
  });

  it("rejects seeding twice", () => {
    const { service } = setup();
    service.seedMissionInventory("lead-1");
    expect(() => service.seedMissionInventory("lead-2")).toThrow(DomainError);
  });
});

function setup() {
  const crewLeads = new CrewLeadRegistry();
  crewLeads.register("lead-1", "Aiko");
  crewLeads.register("lead-2", "Ben");
  crewLeads.register("lead-3", "Cara");

  const catalog = new ResourceCatalog();
  const service = new ResourceManagementService(crewLeads, catalog);
  return { service, catalog, crewLeads };
}
