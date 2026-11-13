export default class LRU<T> {
    private _cache: { [key: string]: LRUNode<T> } = {};
    private _head: LRUNode<T>;
    private _tail: LRUNode<T>;
    private _size: number;
    private _deleteCb: (data: T) => void
    constructor(size: number, deleteCb?: (data: T) => void) {
        this._size = size;
        this._deleteCb = deleteCb;
        this._head = { id: "", prev: null, next: null, data: null };
        this._tail = { id: "", prev: null, next: null, data: null };
        this._head.next = this._tail;
        this._tail.prev = this._head;
    }

    private delete() {
        let lruNode = this._head.next;
        this._deleteCb && this._deleteCb(lruNode.data);
        delete this._cache[lruNode.id];
        this._head.next = lruNode.next;
        lruNode.next.prev = this._head;
        lruNode.data = null;
        lruNode.prev = null;
        lruNode.next = null;
    }

    put(key, data: T) {
        if (this._size == -1) return;
        let lruNode = this._cache[key];
        if (lruNode) {
            lruNode.prev.next = lruNode.next;
            lruNode.next.prev = lruNode.prev;
        }
        lruNode = { id: key, prev: this._tail.prev, next: this._tail, data: data };
        this._tail.prev.next = lruNode;
        this._tail.prev = lruNode;
        this._cache[key] = lruNode;
        if (this._size < Object.keys(this._cache).length) {
            this.delete();
        }
    }

    clear() {
        this._cache = {};
        this._head.next = this._tail;
        this._tail.prev = this._head;
    }
}

export interface LRUNode<T> {
    id: string,
    prev: LRUNode<T>,
    next: LRUNode<T>,
    data: T
}