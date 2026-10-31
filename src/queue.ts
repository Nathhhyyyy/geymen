import { Queue as QueueInterface } from "./types";

export class Queue<T> implements QueueInterface<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.items.shift() || null;
  }

  peek(): T | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }

  toString(): string {
    return this.items.map(item => String(item)).join(" -> ");
  }
}

export class QueueFactory {
  static createQueues<T>(count: number): Queue<T>[] {
    const queues: Queue<T>[] = [];
    for (let i = 0; i < count; i++) {
      queues.push(new Queue<T>());
    }
    return queues;
  }
}
