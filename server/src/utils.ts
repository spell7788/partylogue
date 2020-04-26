import mongoose from "mongoose";
import logger from "./logger";

export function forever() {
  return new Promise(() => { return; });
}

export function Singleton<T>() {
  return class {
    public static init(...args: any[]): void {
      if (this.instance) {
        console.warn("instance already initialized: %O", this.instance);
        return;
      }

      this.instance = new this(...args) as T;
    }

    public static getInstance(): T {
      if (!this.instance) {
        throw new Error("you have to initialize instance first");
      }

      return this.instance;
    }

    private static instance: T;
    protected constructor(...args: any[]) { }
  };
}

type ObjectId = mongoose.Types.ObjectId;
export function isObjectId<T>(value: ObjectId | T): value is ObjectId {
  return (value instanceof mongoose.Types.ObjectId);
}
