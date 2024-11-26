import fs from "fs";
import path from "path";

export default class JSONStorage {
  private static instance: JSONStorage;
  private storagePath: string;

  private constructor(
    storagePath: string = path.join(__dirname, "../../storage.json")
  ) {
    this.storagePath = storagePath;
    this.initialize();
  }

  public static getInstance(storagePath?: string): JSONStorage {
    if (!JSONStorage.instance) {
      JSONStorage.instance = new JSONStorage(storagePath);
    }
    return JSONStorage.instance;
  }

  private initialize(): void {
    if (!fs.existsSync(path.dirname(this.storagePath))) {
      fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    }

    if (!fs.existsSync(this.storagePath)) {
      fs.writeFileSync(this.storagePath, "{}", "utf8");
    }
  }

  public static get<T>(key: string): T | null {
    return JSONStorage.getInstance().getItem<T>(key);
  }

  public static set(key: string, value: any): boolean {
    return JSONStorage.getInstance().setItem(key, value);
  }

  public static clear(): boolean {
    return JSONStorage.getInstance().clearStorage();
  }

  private getItem<T>(key: string): T | null {
    try {
      const data = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
      return data[key] || null;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  }

  private setItem(key: string, value: any): boolean {
    try {
      const data = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
      data[key] = value;
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error("Error writing to storage:", error);
      return false;
    }
  }

  private clearStorage(): boolean {
    try {
      fs.writeFileSync(this.storagePath, "{}", "utf8");
      return true;
    } catch (error) {
      console.error("Error clearing storage:", error);
      return false;
    }
  }
}
