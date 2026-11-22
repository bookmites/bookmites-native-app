export interface Event<N extends string = string> {
    name : N;
}

export type EventCallback<E extends Event> = (event:E) => void;

export class EventListener<E extends Event> {
    protected _listeners = new Set<EventCallback<E>>();
    publish(event:E) {
        this._listeners.forEach(callback => { callback(event) });
    }
    subscribe(callback:EventCallback<E>) {
        this._listeners.add(callback);
        return {
            remove: () => { this.unsubscribe(callback) }
        };
    }
    unsubscribe(callback:EventCallback<E>) {
        this._listeners.delete(callback);
    }
    passTo(listener: EventListener<E>) {
        this.subscribe(event => { listener.publish(event) })
    }
}

class EventPromise<E extends Event> {
    private readonly _promise : Promise<E>
    private _resolve! : (value: E | PromiseLike<E>) => void
    constructor() {
        this._promise = new Promise((resolve) => {
            this._resolve = resolve
        })
    }

    get promise() {
        return this._promise
    }

    resolve(event:E) {
        this._resolve(event)
    }
}

export class EventListenerWithPromises<E extends Event> extends EventListener<E> {
    protected _promises = new Map<E['name'], EventPromise<E>>();
    override publish(event:E) {
        super.publish(event)
        let promise = this._promises.get(event.name)
        if (!promise) {
            promise = new EventPromise()
            this._promises.set(event.name, promise)
        }
        promise.resolve(event)
    }

    promise(name: E['name'], forceNew = false) {
        let promise = this._promises.get(name)
        if (!promise || forceNew) {
            promise = new EventPromise()
            this._promises.set(name, promise)
        }
        return promise.promise as Promise<E & {name: E['name']}>
    }
}
