import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { ResourceType } from "../src/domain/Resource.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceDiscoveryService } from "../src/application/ResourceDiscoveryService.js";

describe("ResourceDiscoveryService", () => {
  it("shows a silver passenger only silver-minimum active resources", () => {
    const { discovery } = setupWithInventory();

    const visible = discovery.listAccessibleResources("p-silver");
    expect(visible.map((r) => r.name)).toEqual([
      "Food Supply Station",
      "Sleeping Pod",
      "Basic Hygiene Pod",
    ]);
  });

  it("shows a gold passenger silver and gold resources", () => {
    const { discovery } = setupWithInventory();

    const visible = discovery.listAccessibleResources("p-gold");
    expect(visible.map((r) => r.name)).toEqual([
      "Food Supply Station",
      "Sleeping Pod",
      "Basic Hygiene Pod",
      "Private Cabin",
      "Advanced Medical Bay",
    ]);
  });

  it("shows a platinum passenger the full active catalog", () => {
    const { discovery, catalog } = setupWithInventory();

    const visible = discovery.listAccessibleResources("p-platinum");
    expect(visible).toHaveLength(catalog.getAll().length);
  });

  it("hides decommissioned resources even when the passenger qualifies", () => {
    const { discovery, resources } = setupWithInventory();
    resources.decommissionResource("lead-1", "food-station");

    const visible = discovery.listAccessibleResources("p-platinum");
    expect(visible.map((r) => r.id)).not.toContain("food-station");
  });

  it("rejects discovery for an unknown passenger", () => {
    const { discovery } = setupWithInventory();
    expect(() => discovery.listAccessibleResources("missing")).toThrow(/not found/i);
  });

  it("filters a manually provisioned resource by minimum level", () => {
    const crewLeads = new CrewLeadRegistry();
    crewLeads.register("lead-1", "Aiko");
    crewLeads.register("lead-2", "Ben");
    crewLeads.register("lead-3", "Cara");

    const passengers = new PassengerRegistry();
    const passengerService = new PassengerManagementService(crewLeads, passengers);
    passengerService.createPassenger(
      "lead-1",
      "p-silver",
      "Yuri",
      MembershipLevel.Silver,
    );

    const catalog = new ResourceCatalog();
    const resourceService = new ResourceManagementService(crewLeads, catalog);
    resourceService.provisionResource(
      "lead-1",
      "fitness-1",
      "Fitness Center",
      ResourceType.FitnessCenter,
      MembershipLevel.Gold,
    );

    const discovery = new ResourceDiscoveryService(passengers, catalog);
    expect(discovery.listAccessibleResources("p-silver")).toEqual([]);
  });
});

function setupWithInventory() {
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

  const discovery = new ResourceDiscoveryService(passengers, catalog);
  return { discovery, catalog, resources, passengers, crewLeads };
}
