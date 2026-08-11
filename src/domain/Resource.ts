import { MembershipLevel } from "./MembershipLevel.js";

export enum ResourceType {
  SleepingPod = "SLEEPING_POD",
  FoodStation = "FOOD_STATION",
  OxygenRefill = "OXYGEN_REFILL",
  MedicalBay = "MEDICAL_BAY",
  HygienePod = "HYGIENE_POD",
  FitnessCenter = "FITNESS_CENTER",
  PrivateCabin = "PRIVATE_CABIN",
  RecreationDeck = "RECREATION_DECK",
}

export interface Resource {
  readonly id: string;
  readonly name: string;
  readonly type: ResourceType;
  readonly minimumMembershipLevel: MembershipLevel;
  readonly decommissioned: boolean;
}
