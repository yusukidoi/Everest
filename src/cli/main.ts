import { pathToFileURL } from "node:url";
import { DomainError } from "../domain/DomainError.js";
import { MembershipLevel } from "../domain/MembershipLevel.js";
import {
  createPrmsSystem,
  seedDemoMission,
  type PrmsSystem,
} from "../infrastructure/PrmsSystem.js";

function print(message: string): void {
  console.log(message);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseLevel(raw: string): MembershipLevel {
  const normalized = raw.trim().toUpperCase();
  const match = Object.values(MembershipLevel).find((level) => level === normalized);
  if (!match) {
    throw new DomainError(
      `Unknown membership '${raw}'. Use SILVER, GOLD, or PLATINUM.`,
    );
  }
  return match;
}

export function runDemo(system: PrmsSystem): void {
  print("=== Spaceship X26 PRMS demo ===");
  print(`Crew leads: ${system.crewLeads.getAll().map((l) => l.name).join(", ")}`);
  print(
    `Passengers: ${system.passengers
      .getAll()
      .map((p) => `${p.name}(${p.membershipLevel})`)
      .join(", ")}`,
  );
  print("");

  print("Yuri (Silver) discovers accessible resources:");
  printJson(system.discovery.listAccessibleResources("p-silver").map((r) => r.name));

  print("\nYuri uses Food Supply Station:");
  printJson(system.usage.useResource("p-silver", "food-station"));

  print("\nYuri is denied Luxury Oxygen Pod:");
  try {
    system.usage.useResource("p-silver", "luxury-o2");
  } catch (error) {
    print(`  ${error instanceof Error ? error.message : String(error)}`);
  }

  print("\nAiko upgrades Yuri to Gold:");
  printJson(
    system.passengerManagement.upgradePassenger(
      "lead-1",
      "p-silver",
      MembershipLevel.Gold,
    ),
  );

  print("\nYuri (now Gold) uses Advanced Medical Bay:");
  printJson(system.usage.useResource("p-silver", "adv-medical"));

  print("\nPersonal history for Yuri:");
  printJson(system.reporting.getPersonalHistory("p-silver", { includeDenied: true }));

  print("\nCrew Lead usage by membership:");
  printJson(system.reporting.getUsageByMembershipLevel("lead-1"));

  print("\nHigh-demand resources:");
  printJson(system.reporting.getHighDemandResources("lead-1"));
}

function printUsage(): never {
  print(`Spaceship X26 PRMS CLI

Commands:
  demo
  discover <passengerId>
  use <passengerId> <resourceId>
  history <passengerId> [--denied]
  passengers <crewLeadId>
  resources <crewLeadId>
  upgrade <crewLeadId> <passengerId> <SILVER|GOLD|PLATINUM>
  downgrade <crewLeadId> <passengerId> <SILVER|GOLD|PLATINUM>
  report-levels <crewLeadId>
  report-demand <crewLeadId> [limit]

Examples:
  npm start
  npm start -- discover p-silver
  npm start -- use p-gold adv-medical
  npm start -- upgrade lead-1 p-silver GOLD
`);
  process.exit(1);
}

export function runCli(argv: string[]): void {
  const system = createPrmsSystem();
  seedDemoMission(system);

  const [command, ...args] = argv;

  try {
    switch (command ?? "demo") {
      case "demo":
        runDemo(system);
        break;
      case "discover": {
        const passengerId = args[0];
        if (!passengerId) printUsage();
        printJson(
          system.discovery.listAccessibleResources(passengerId).map((r) => ({
            id: r.id,
            name: r.name,
            minimumMembershipLevel: r.minimumMembershipLevel,
          })),
        );
        break;
      }
      case "use": {
        const passengerId = args[0];
        const resourceId = args[1];
        if (!passengerId || !resourceId) printUsage();
        printJson(system.usage.useResource(passengerId, resourceId));
        break;
      }
      case "history": {
        const passengerId = args[0];
        if (!passengerId) printUsage();
        printJson(
          system.reporting.getPersonalHistory(passengerId, {
            includeDenied: args.includes("--denied"),
          }),
        );
        break;
      }
      case "passengers": {
        const leadId = args[0];
        if (!leadId) printUsage();
        printJson(system.passengerManagement.listPassengers(leadId));
        break;
      }
      case "resources": {
        const leadId = args[0];
        if (!leadId) printUsage();
        printJson(system.resourceManagement.listResources(leadId));
        break;
      }
      case "upgrade":
      case "downgrade": {
        const leadId = args[0];
        const passengerId = args[1];
        const levelRaw = args[2];
        if (!leadId || !passengerId || !levelRaw) printUsage();
        const level = parseLevel(levelRaw);
        const updated =
          command === "upgrade"
            ? system.passengerManagement.upgradePassenger(leadId, passengerId, level)
            : system.passengerManagement.downgradePassenger(
                leadId,
                passengerId,
                level,
              );
        printJson(updated);
        break;
      }
      case "report-levels": {
        const leadId = args[0];
        if (!leadId) printUsage();
        printJson(system.reporting.getUsageByMembershipLevel(leadId));
        break;
      }
      case "report-demand": {
        const leadId = args[0];
        if (!leadId) printUsage();
        const limitRaw = args[1];
        const limit = limitRaw ? Number(limitRaw) : undefined;
        if (limitRaw && !Number.isFinite(limit)) {
          throw new DomainError("Demand limit must be a number.");
        }
        printJson(
          system.reporting.getHighDemandResources(
            leadId,
            limit === undefined ? {} : { limit },
          ),
        );
        break;
      }
      case "help":
      case "--help":
      case "-h":
        printUsage();
        break;
      default:
        print(`Unknown command: ${command}`);
        printUsage();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

function isExecutedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (isExecutedDirectly()) {
  runCli(process.argv.slice(2));
}
