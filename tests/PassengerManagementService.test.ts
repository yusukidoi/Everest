import { describe, expect, it } from "vitest";
import { CrewLeadRegistry } from "../src/domain/CrewLeadRegistry.js";
import { DomainError } from "../src/domain/DomainError.js";
import { MembershipLevel } from "../src/domain/MembershipLevel.js";
import { PassengerRegistry } from "../src/domain/PassengerRegistry.js";
import { PassengerManagementService } from "../src/application/PassengerManagementService.js";

describe("PassengerManagementService", () => {
  it("lets a crew lead create a passenger profile", () => {
    const { service } = setup();

    const passenger = service.createPassenger(
      "lead-1",
      "p-1",
      "Yuri",
      MembershipLevel.Silver,
    );

    expect(passenger).toEqual({
      id: "p-1",
      name: "Yuri",
      membershipLevel: MembershipLevel.Silver,
    });
    expect(service.getPassenger("p-1")).toEqual(passenger);
  });

  it("rejects passenger creation by a non crew lead", () => {
    const { service } = setup();

    expect(() =>
      service.createPassenger("hacker", "p-1", "Yuri", MembershipLevel.Silver),
    ).toThrow(DomainError);
    expect(() =>
      service.createPassenger("hacker", "p-1", "Yuri", MembershipLevel.Silver),
    ).toThrow(/only crew leads/i);
  });

  it("rejects duplicate passenger ids", () => {
    const { service } = setup();
    service.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    expect(() =>
      service.createPassenger("lead-2", "p-1", "Other", MembershipLevel.Gold),
    ).toThrow(/already exists/i);
  });

  it("lets a crew lead rename a passenger", () => {
    const { service } = setup();
    service.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    const updated = service.renamePassenger("lead-2", "p-1", "Yuri Nova");
    expect(updated.name).toBe("Yuri Nova");
  });

  it("lets a crew lead remove a passenger", () => {
    const { service } = setup();
    service.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);

    service.removePassenger("lead-1", "p-1");
    expect(service.findPassenger("p-1")).toBeUndefined();
  });

  it("lists all passengers for a crew lead", () => {
    const { service } = setup();
    service.createPassenger("lead-1", "p-1", "Yuri", MembershipLevel.Silver);
    service.createPassenger("lead-1", "p-2", "Mika", MembershipLevel.Gold);

    expect(service.listPassengers("lead-3")).toHaveLength(2);
  });

  it("rejects management actions for unknown passengers", () => {
    const { service } = setup();
    expect(() => service.renamePassenger("lead-1", "missing", "X")).toThrow(
      /not found/i,
    );
    expect(() => service.removePassenger("lead-1", "missing")).toThrow(
      /not found/i,
    );
  });
});

function setup() {
  const crewLeads = new CrewLeadRegistry();
  crewLeads.register("lead-1", "Aiko");
  crewLeads.register("lead-2", "Ben");
  crewLeads.register("lead-3", "Cara");

  const passengers = new PassengerRegistry();
  const service = new PassengerManagementService(crewLeads, passengers);
  return { service, passengers, crewLeads };
}
