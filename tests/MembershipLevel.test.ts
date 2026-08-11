import { describe, expect, it } from "vitest";
import {
  MembershipLevel,
  canAccess,
  compareLevels,
  inheritsFrom,
} from "../src/domain/MembershipLevel.js";

describe("MembershipLevel hierarchy", () => {
  it("orders Silver < Gold < Platinum", () => {
    expect(compareLevels(MembershipLevel.Silver, MembershipLevel.Gold)).toBeLessThan(0);
    expect(compareLevels(MembershipLevel.Gold, MembershipLevel.Platinum)).toBeLessThan(0);
    expect(compareLevels(MembershipLevel.Platinum, MembershipLevel.Silver)).toBeGreaterThan(0);
    expect(compareLevels(MembershipLevel.Gold, MembershipLevel.Gold)).toBe(0);
  });

  it("lets higher levels inherit lower-level access", () => {
    expect(inheritsFrom(MembershipLevel.Gold, MembershipLevel.Silver)).toBe(true);
    expect(inheritsFrom(MembershipLevel.Platinum, MembershipLevel.Silver)).toBe(true);
    expect(inheritsFrom(MembershipLevel.Platinum, MembershipLevel.Gold)).toBe(true);
    expect(inheritsFrom(MembershipLevel.Silver, MembershipLevel.Silver)).toBe(true);
  });

  it("does not grant reverse inheritance", () => {
    expect(inheritsFrom(MembershipLevel.Silver, MembershipLevel.Gold)).toBe(false);
    expect(inheritsFrom(MembershipLevel.Gold, MembershipLevel.Platinum)).toBe(false);
    expect(inheritsFrom(MembershipLevel.Silver, MembershipLevel.Platinum)).toBe(false);
  });

  it("allows resource access when passenger level meets or exceeds minimum", () => {
    expect(canAccess(MembershipLevel.Silver, MembershipLevel.Silver)).toBe(true);
    expect(canAccess(MembershipLevel.Gold, MembershipLevel.Silver)).toBe(true);
    expect(canAccess(MembershipLevel.Platinum, MembershipLevel.Gold)).toBe(true);
    expect(canAccess(MembershipLevel.Silver, MembershipLevel.Gold)).toBe(false);
    expect(canAccess(MembershipLevel.Gold, MembershipLevel.Platinum)).toBe(false);
  });
});
