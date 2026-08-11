import { PassengerManagementService } from "../application/PassengerManagementService.js";
import { ReportingService } from "../application/ReportingService.js";
import { ResourceDiscoveryService } from "../application/ResourceDiscoveryService.js";
import { ResourceManagementService } from "../application/ResourceManagementService.js";
import { ResourceUsageService } from "../application/ResourceUsageService.js";
import { CrewLeadRegistry } from "../domain/CrewLeadRegistry.js";
import { MembershipLevel } from "../domain/MembershipLevel.js";
import { PassengerRegistry } from "../domain/PassengerRegistry.js";
import { ResourceCatalog } from "../domain/ResourceCatalog.js";
import { UsageLog } from "../domain/UsageLog.js";

export interface PrmsSystem {
  readonly crewLeads: CrewLeadRegistry;
  readonly passengers: PassengerRegistry;
  readonly catalog: ResourceCatalog;
  readonly usageLog: UsageLog;
  readonly passengerManagement: PassengerManagementService;
  readonly resourceManagement: ResourceManagementService;
  readonly discovery: ResourceDiscoveryService;
  readonly usage: ResourceUsageService;
  readonly reporting: ReportingService;
}

/** Composition root: wires in-memory PRMS collaborators. */
export function createPrmsSystem(): PrmsSystem {
  const crewLeads = new CrewLeadRegistry();
  const passengers = new PassengerRegistry();
  const catalog = new ResourceCatalog();
  const usageLog = new UsageLog();

  const passengerManagement = new PassengerManagementService(crewLeads, passengers);
  const resourceManagement = new ResourceManagementService(crewLeads, catalog);
  const discovery = new ResourceDiscoveryService(passengers, catalog);
  const usage = new ResourceUsageService(passengers, catalog, usageLog);
  const reporting = new ReportingService(crewLeads, passengers, catalog, usageLog);

  return {
    crewLeads,
    passengers,
    catalog,
    usageLog,
    passengerManagement,
    resourceManagement,
    discovery,
    usage,
    reporting,
  };
}

/** Seeds the three Crew Leads, base inventory, and sample passengers. */
export function seedDemoMission(system: PrmsSystem): void {
  system.crewLeads.register("lead-1", "Aiko");
  system.crewLeads.register("lead-2", "Ben");
  system.crewLeads.register("lead-3", "Cara");

  system.resourceManagement.seedMissionInventory("lead-1");

  system.passengerManagement.createPassenger(
    "lead-1",
    "p-silver",
    "Yuri",
    MembershipLevel.Silver,
  );
  system.passengerManagement.createPassenger(
    "lead-1",
    "p-gold",
    "Mika",
    MembershipLevel.Gold,
  );
  system.passengerManagement.createPassenger(
    "lead-1",
    "p-platinum",
    "Nova",
    MembershipLevel.Platinum,
  );
}
