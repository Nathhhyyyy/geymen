import { Queue } from "./queue";
import { Station, SortSnapshot, SortMode } from "./types";

export class RadixSort {
  private snapshots: SortSnapshot[] = [];

  public getSnapshots(): SortSnapshot[] {
    return [...this.snapshots];
  }

  public clearSnapshots(): void {
    this.snapshots = [];
  }

  public sortByPrice(stations: Station[], ascending: boolean = true): Station[] {
    this.clearSnapshots();
    const prices = stations.map(s => s.basePrice);
    const sortedPrices = this.radixSort(prices, ascending);
    
    const priceToStations = new Map<number, Station[]>();
    stations.forEach(station => {
      if (!priceToStations.has(station.basePrice)) {
        priceToStations.set(station.basePrice, []);
      }
      priceToStations.get(station.basePrice)!.push(station);
    });

    const result: Station[] = [];
    sortedPrices.forEach(price => {
      const matchingStations = priceToStations.get(price) || [];
      result.push(...matchingStations);
    });

    return result;
  }

  public sortByDistance(stations: Station[], ascending: boolean = true): Station[] {
    this.clearSnapshots();
    const distances = stations.map(s => s.distance);
    const sortedDistances = this.radixSort(distances, ascending);
    
    const distanceToStations = new Map<number, Station[]>();
    stations.forEach(station => {
      if (!distanceToStations.has(station.distance)) {
        distanceToStations.set(station.distance, []);
      }
      distanceToStations.get(station.distance)!.push(station);
    });

    const result: Station[] = [];
    sortedDistances.forEach(distance => {
      const matchingStations = distanceToStations.get(distance) || [];
      result.push(...matchingStations);
    });

    return result;
  }

  public sortByTrueCost(stations: Station[], trueCosts: number[], ascending: boolean = true): Station[] {
    this.clearSnapshots();
    const sortedCosts = this.radixSort(trueCosts, ascending);
    
    const costToStations = new Map<number, Station[]>();
    stations.forEach((station, index) => {
      const cost = trueCosts[index];
      if (!costToStations.has(cost)) {
        costToStations.set(cost, []);
      }
      costToStations.get(cost)!.push(station);
    });

    const result: Station[] = [];
    sortedCosts.forEach(cost => {
      const matchingStations = costToStations.get(cost) || [];
      result.push(...matchingStations);
    });

    return result;
  }

  private radixSort(arr: number[], ascending: boolean = true): number[] {
    if (arr.length === 0) return arr;

    const max = Math.max(...arr);
    const maxDigits = this.getDigitCount(max);

    let currentArray = [...arr];
    this.snapshots.push({
      pass: 0,
      digitPosition: 0,
      buckets: {},
      currentArray: currentArray.map((val, idx) => ({
        id: String(idx),
        name: `Item ${idx}`,
        address: "",
        distance: val,
        basePrice: val,
        fuelType: "UNLEADED" as any,
        trend: "→" as any,
        priceHistory: []
      }))
    });

    for (let digitPos = 0; digitPos < maxDigits; digitPos++) {
      currentArray = this.sortByDigit(currentArray, digitPos, ascending);
      
      const buckets: { [key: number]: Station[] } = {};
      for (let i = 0; i < 10; i++) {
        buckets[i] = [];
      }
      
      currentArray.forEach((val, idx) => {
        const digit = this.getDigit(val, digitPos);
        buckets[digit].push({
          id: String(idx),
          name: `Item ${idx}`,
          address: "",
          distance: val,
          basePrice: val,
          fuelType: "UNLEADED" as any,
          trend: "→" as any,
          priceHistory: []
        });
      });

      this.snapshots.push({
        pass: digitPos + 1,
        digitPosition: digitPos,
        buckets,
        currentArray: currentArray.map((val, idx) => ({
          id: String(idx),
          name: `Item ${idx}`,
          address: "",
          distance: val,
          basePrice: val,
          fuelType: "UNLEADED" as any,
          trend: "→" as any,
          priceHistory: []
        }))
      });
    }

    return currentArray;
  }

  private sortByDigit(arr: number[], digitPos: number, ascending: boolean): number[] {
    const queues: Queue<number>[] = [];
    for (let i = 0; i < 10; i++) {
      queues.push(new Queue<number>());
    }

    arr.forEach(num => {
      const digit = this.getDigit(num, digitPos);
      queues[digit].enqueue(num);
    });

    let result: number[] = [];
    if (ascending) {
      for (let i = 0; i < 10; i++) {
        while (!queues[i].isEmpty()) {
          result.push(queues[i].dequeue()!);
        }
      }
    } else {
      for (let i = 9; i >= 0; i--) {
        while (!queues[i].isEmpty()) {
          result.push(queues[i].dequeue()!);
        }
      }
    }

    return result;
  }

  private getDigit(num: number, position: number): number {
    return Math.floor(num / Math.pow(10, position)) % 10;
  }

  private getDigitCount(num: number): number {
    if (num === 0) return 1;
    return Math.floor(Math.log10(Math.abs(num))) + 1;
  }

  public visualizeSorting(stations: Station[], mode: SortMode, trueCosts?: number[]): Station[] {
    switch (mode.type) {
      case "CHEAPEST":
        return this.sortByPrice(stations, true);
      case "NEAREST":
        return this.sortByDistance(stations, true);
      case "TRUE_COST":
        if (!trueCosts) {
          throw new Error("True costs required for TRUE_COST sort mode");
        }
        return this.sortByTrueCost(stations, trueCosts, true);
      default:
        return stations;
    }
  }
}
