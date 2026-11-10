import UUID from "./UUID";

export class EventBase {
    private event_cache: { [key: string]: Array<Tea.Event> } = {};

    public on(key: string, cb: (...args: any[]) => void);
    public on(key: string, cb: (...args: any[]) => void, sort: number);
    public on(key: string, cb: (...args: any[]) => void, target);
    public on(key: string, cb: (...args: any[]) => void, sort: number, target);
    public on(key: string, cb: (...args: any[]) => void, sort?: number, target?) {
        if (!this.event_cache[key])
            this.event_cache[key] = [];

        let event: Tea.Event = {
            cb: cb,
            once: false,
        }
        if (typeof sort === 'number') {
            event.sort = sort;
            target && (event.target = target);
        } else {
            if (sort) event.target = sort;
        }

        let getEvent: Tea.Event = this.event_cache[key].find(e => e.cb === event.cb && e.target === event.target);
        if (getEvent) return getEvent.id;

        event.id = `${key}_${UUID.generateUUID()}`;

        this.event_cache[key].push(event);
        this.event_cache[key].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

        return event.id;
    }

    public once(key: string, cb: (...args: any[]) => void);
    public once(key: string, cb: (...args: any[]) => void, sort: number);
    public once(key: string, cb: (...args: any[]) => void, target);
    public once(key: string, cb: (...args: any[]) => void, sort: number, target);
    public once(key: string, cb: (...args: any[]) => void, sort?: number, target?) {
        if (!this.event_cache[key])
            this.event_cache[key] = [];

        let event: Tea.Event = {
            cb: cb,
            once: true,
        }
        if (typeof sort === 'number') {
            event.sort = sort;
            target && (event.target = target);
        } else {
            if (sort) event.target = sort;
        }

        let getEvent: Tea.Event = this.event_cache[key].find(e => e.cb === event.cb && e.target === event.target);
        if (getEvent) return getEvent.id;

        event.id = `${key}_${UUID.generateUUID()}`;

        this.event_cache[key].push(event);
        this.event_cache[key].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

        return event.id;
    }

    public off(key: string, param: string);
    public off(key: string, param: (...args: any[]) => void);
    public off(key: string, param: string | ((...args: any[]) => void)) {
        if (!this.event_cache[key])
            return;

        if (typeof param === 'string') {
            this.removeEventById(key, param);
            return;
        }

        this.removeByCb(key, param);
    }

    private removeEventById(key: string, id: string) {
        let index = this.event_cache[key].findIndex(e => e.id === id);
        if (index !== -1)
            this.event_cache[key].splice(index, 1);
    }

    private removeByCb(key: string, cb: (...args: any[]) => void) {
        this.event_cache[key] = this.event_cache[key].filter(e => e.cb !== cb);
    }

    public clearEvent(key: string) {
        if (!this.event_cache[key])
            return;

        delete this.event_cache[key];
    }

    public trigger(key: string, ...args: any[]) {
        if (!this.event_cache[key])
            return;
        const events = [...this.event_cache[key]];
        for (let i = 0; i < events.length; i++) {
            let target = events[i].target;
            let cb: (...args: any[]) => void = events[i].cb;
            if(target){
                cb.apply(target, args);
            }else{
                cb(...args);
            }
        }
        this.event_cache[key] = this.event_cache[key].filter(e => !e.once);
    }

    public clearEventCache() {
        this.event_cache = {};
    }
}