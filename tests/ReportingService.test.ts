import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { ResourceCatalog } from "../src/domain/ResourceCatalog.js";
import { UsageLog } from "../src/domain/UsageLog.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";
import { ResourceManagementService } from "../src/application/ResourceManagementService.js";
import { ResourceUsageService } from "../src/application/ResourceUsageService.js";
import { ReportingService } from "../src/application/ReportingService.js";

describe("ReportingService", () => {
  it("returns personal usage history for a passenger (allowed only)", () => {
    const { usage, reports } = setup();
    usage.useResource("p-gold", "food-station");
    usage.useResource("p-gold", "adv-medical");
    expect(() => usage.useResource("p-gold", "luxury-o2")).toThrow();

    const history = reports.getPersonalHistory("p-gold");
    expect(history.map((r) => r.resourceId)).toEqual([
      "food-station",
      "adv-medical",
    ]);
  });

  it("includes denied attempts when requested", () => {
    const { usage, reports } = setup();
    usage.useResource("p-silver", "food-station");
    expect(() => usage.useResource("p-silver", "luxury-o2")).toThrow();

    const history = reports.getPersonalHistory("p-silver", {
      includeDenied: true,
    });
    expect(history).toHaveLength(2);
    expect(history.map((r) => r.outcome)).toEqual(["ALLOWED", "DENIED"]);
  });

  it("aggregates allowed usage counts grouped by passenger membership", () => {
    const { usage, reports } = setup();
    usage.useResource("p-silver", "food-station");
    usage.useResource("p-silver", "sleeping-pod");
    usage.useResource("p-gold", "food-station");
    usage.useResource("p-platinum", "luxury-o2");
    usage.useResource("p-platinum", "vip-rec");

    const summary = reports.getUsageByMembershipLevel("lead-1");
    expect(summary).toEqual([
      {
        membershipLevel: MembershipLevel.Silver,
        passengerCount: 1,
        allowedUsageCount: 2,
      },
      {
        membershipLevel: MembershipLevel.Gold,
        passengerCount: 1,
        allowedUsageCount: 1,
      },
      {
        membershipLevel: MembershipLevel.Platinum,
        passengerCount: 1,
        allowedUsageCount: 2,
      },
    ]);
  });

  it("rejects aggregated reports for non crew leads", () => {
    const { reports } = setup();
    expect(() => reports.getUsageByMembershipLevel("hacker")).toThrow(
      /only crew leads/i,
    );
    expect(() => reports.getHighDemandResources("hacker")).toThrow(
      /only crew leads/i,
    );
  });

  it("ranks high-demand resources by allowed usage", () => {
    const { usage, reports } = setup();
    usage.useResource("p-silver", "food-station");
    usage.useResource("p-gold", "food-station");
    usage.useResource("p-platinum", "food-station");
    usage.useResource("p-platinum", "luxury-o2");
    usage.useResource("p-platinum", "luxury-o2");

    const demand = reports.getHighDemandResources("lead-2");
    expect(demand.slice(0, 2)).toEqual([
      {
        resourceId: "food-station",
        resourceName: "Food Supply Station",
        allowedUsageCount: 3,
      },
      {
        resourceId: "luxury-o2",
        resourceName: "Luxury Oxygen Pod",
        allowedUsageCount: 2,
      },
    ]);
  });

  it("supports a demand limit for analytics focus", () => {
    const { usage, reports } = setup();
    usage.useResource("p-silver", "food-station");
    usage.useResource("p-gold", "sleeping-pod");
    usage.useResource("p-platinum", "luxury-o2");

    expect(reports.getHighDemandResources("lead-1", { limit: 1 })).toHaveLength(1);
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
  const reports = new ReportingService(crewLeads, passengers, catalog, log);
  return { usage, reports, log };
}
