import { sys } from "cc";
import { Singleton } from "../Util/SingletonFactory";

@Singleton()
export default class LocallyData{
    getInt(key: string): number {
        let val = sys.localStorage.getItem(key)
        return val ?? 0;
    }
    setInt(key: string, value: number): void {
        if(typeof value !== "number" || isNaN(value)){
            ERROR("value must be a number ======>", value);
            return;
        }
        sys.localStorage.setItem(key, value.toString());
    }
    getChars(key: string): string {
        let val = sys.localStorage.getItem(key)
        return val ?? "";
    }
    setChars(key: string, value: string): void {
        if(typeof value !== "string"){
            ERROR("value must be a string ======>", value);
            return;
        }
        sys.localStorage.setItem(key, value);
    }
    getBool(key: string): boolean {
        let val = sys.localStorage.getItem(key)
        return val == "true";
    }
    setBool(key: string, value: boolean): void {
        if(typeof value !== "boolean"){
            ERROR("value must be a boolean ======>", value);
            return;
        }
        sys.localStorage.setItem(key, value.toString());
    }
    getObj(key: string): any {
        let val = sys.localStorage.getItem(key)
        return JSON.parse(val ?? "{}");
    }
    setObj(key: string, value: any): void {
        if(typeof value !== "object" || value === null){
            ERROR("value must be an object ======>", value);
            return;
        }
        sys.localStorage.setItem(key, JSON.stringify(value));
    }
    remove(key: string): void {
        sys.localStorage.removeItem(key);
    }
    clear(): void {
        sys.localStorage.clear();
    }
}