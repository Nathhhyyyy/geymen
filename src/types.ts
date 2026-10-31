export interface Station {
  id: string;
  name: string;
  address: string;
  distance: number; // in meters
  basePrice: number; // in centavos (integer)
  fuelType: FuelType;
  trend: TrendIndicator;
  priceHistory: number[]; // last 5 weeks in centavos
}

export enum FuelType {
  UNLEADED = "UNLEADED",
  PREMIUM = "PREMIUM",
  DIESEL = "DIESEL"
}

export enum TrendIndicator {
  UP = "▲",
  DOWN = "▼",
  STABLE = "→"
}

export interface Queue<T> {
  enqueue(item: T): void;
  dequeue(): T | null;
  peek(): T | null;
  isEmpty(): boolean;
  size(): number;
  clear(): void;
}

export interface SortSnapshot {
  pass: number;
  digitPosition: number;
  buckets: { [key: number]: Station[] };
  currentArray: Station[];
}

export interface PriceHistory {
  stationId: string;
  stationName: string;
  weeks: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5: number;
  };
}

export interface VehicleEfficiency {
  type: string;
  kmPerLiter: number;
}

export interface SortMode {
  type: "CHEAPEST" | "NEAREST" | "TRUE_COST";
}

export interface TrueCostResult {
  stationId: string;
  trueCost: number; // in centavos
  breakdown: {
    fuelCost: number;
    travelCost: number;
  };
}
