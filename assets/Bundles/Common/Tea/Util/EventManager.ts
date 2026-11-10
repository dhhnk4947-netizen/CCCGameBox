import { EventBase } from "./EventBase";
import { Singleton } from "./SingletonFactory";

/**
 * 事件管理器新建模板
 * export class {ClassName} extends EventBase{}
 */
@Singleton()
export default class EventManager extends EventBase{}