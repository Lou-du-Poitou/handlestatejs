/**
 * HandleStateJS
 * @file This is a dynamic rendering library with state management
 * @author lou_du_poitou
 * @license MIT
 * @copyright V / Lou du Poitou 2026
 * @link https://github.com/Lou-du-Poitou/handlestatejs GitHub
 * @version 2
 * 
 * http://loudupoitou.dns-dynamic.net
 * Made by V / Lou du Poitou
 */

export const { state, computed, batch } = (function () {

let __activeComputed = null;

let __activeBatch = false;
let __dirtyBatch = new Set();

/**
 * The HandleState class allows for the management 
 * of dynamic state rendering.
 */
class HandleState {
    #value;
    #connected = new Set();
    #rendering = false; // To avoid setter in render (infinite loop)

    /**
     * Create the state with an initialValue
     * @param {any} initialValue 
     */
    constructor(initialValue = null) {
        this.#value = initialValue;
    }

    /**
     * Returns the state value
     * @returns {any}
     */
    get() {
        // To track the state if a computed 
        // state is active
        ComputedState.track(this);
        return this.#value;
    }

    /**
     * Define the state value
     * @param {any | Function} v 
     * @returns {void}
     */
    set(v) {
        let newValue = v instanceof Function
            ? v(this.#value)
            : v;

        if (Object.is(this.#value, newValue))
            return; // Do not update if the value does not change

        this.#value = newValue;

        if (this.#rendering) {
            throw new Error("a setter should not be used in a render");
        }

        this.#rendering = true;
        try {
            if (__activeBatch) {
                // Add the renders to the batch queue
                for (const render of [...this.#connected]) {
                    __dirtyBatch.add(render);
                }
            } else {
                // Execute renders directly
                for (const render of [...this.#connected]) {
                    render();
                }
            }
        } finally {
            this.#rendering = false;
        }
    }

    /**
     * Connect a render to state management
     * @param {Function} render 
     * @param {{
     *      firstRender: boolean, 
     *      signal: AbortController.signal
     * }} options 
     * @returns {Function} to disconnect the render
     */
    connect(
        render,
        { 
            firstRender=true,
            signal
        } = { 
            firstRender: true
        }
    ) {
        if (!(render instanceof Function)) {
            throw new TypeError("render must be a Function");
        }

        this.#connected.add(render);

        // To delete the render with AbortController
        signal?.addEventListener('abort', () => {
            this.#connected.delete(render);
        }, {
            once: true
        });

        if (firstRender) {
            render();
        }

        // Returns a function to disconnect the render
        return () => this.disconnect(render);
    }

    /**
     * Disconnect a render to state management
     * @param {Function} render 
     * @returns {void}
     */
    disconnect(render) {
        this.#connected.delete(render);
    }

    /**
     * Disconnect all renders from state management
     * @returns {void}
     */
    destroy() {
        this.#connected.clear();
    }
}

/**
 * The ComputedState class allows for managing the 
 * dynamic rendering of derived states.
 * @extends HandleState
 */
class ComputedState extends HandleState {
    #computation;
    #sources = new Set();
    #disconnect = []; // To disconect all sources renders

    /**
     * Create a derived state based on the values ​​
     * of other state(s)
     * @param {Function} computation 
     */
    constructor(computation) {
        if (!(computation instanceof Function)) {
            throw new TypeError("computation must be a Function");
        }

        super(undefined);
        this.#computation = computation;
        this.#recompute();
    }

    /**
     * @internal Allows tracking of state changes for 
     * a HandleState
     * @param {HandleState} source 
     * @returns {void}
     */
    static track(source) {
        if (
            __activeComputed &&
            source !== __activeComputed // Avoid infinite loop
        ) {
            __activeComputed.#sources.add(source);
        }
    }

    /**
     * Recomputes the state value and produces the new renders
     * @returns {void}
     */
    #recompute() {
        // Disconnects previous renders 
        // and resets the sources
        this.#disconnect.forEach(disc => {
            disc();
        });
        this.#disconnect = [];
        this.#sources.clear();

        __activeComputed = this;
        try {
            // Pass the function to parrent to save 
            // the result as value 
            super.set(this.#computation);
        } finally {
            __activeComputed = null;
        }

        // Add recompute to the connected renders 
        // of source states
        const recompute = () => this.#recompute();
        for (const source of [...this.#sources]) {
            this.#disconnect.push(
                source.connect(recompute, {
                    firstRender: false
                })
            );
        }
    }

    /**
     * A computed state is read-only 
     * (cannot be updated manually)
     */
    set() {
        throw new Error("a computed state is read-only");
    }

    /**
     * Disconnects renders, resets sources and trackers
     * @returns {void}
     */
    destroy() {
        this.#disconnect.forEach(disc => {
            disc();
        });
        this.#disconnect = [];
        this.#sources.clear();
        super.destroy();
    }
}

/**
 * Create a state manager
 * ```js
 * const count = state(0);
 * count.connect(() => {
 *      // Runs after every update
 *      console.log(count.get());
 * });
 * 
 * count.set(v => ++v);
 * // Output:
 * // >> 0
 * // >> 1
 * ```
 * @param {any} value 
 * @returns {HandleState}
 */
function state(value) {
    return new HandleState(value);
}

/**
 * Create a derived state
 * ```js
 * const count = state(0);
 * const double = computed(() => count.get() * 2);
 * double.connect(() => {
 *      // Runs after every update
 *      console.log(double.get());
 * });
 * 
 * count.set(v => ++v);
 * // Output:
 * // >> 0
 * // >> 2
 * ```
 * @param {Function} fn 
 * @returns 
 */
function computed(fn) {
    return new ComputedState(fn);
}

/**
 * Group multiple state updates into a 
 * single render pass
 * ```js
 * const a = state(0);
 * const b = state(0);
 * 
 * const render = () => {
 *      // Runs after every update
 *      console.log(a.get(), b.get());
 * };
 * 
 * a.connect(render);
 * b.connect(render);
 * 
 * batch(() => {
 *      a.set(v => ++v);
 *      b.set(v => ++v);
 * });
 * 
 * // Output:
 * // >> 0 0
 * // >> 1 1
 * ```
 * @param {Function} fn SYNCHRONOUS
 * @returns {void}
 */
function batch(fn) {
    if (__activeBatch) // Nested batch
        return fn();

    __activeBatch = true;
    try {
        const result = fn();
        if (result instanceof Promise) {
            throw new TypeError("fn must be a synchronous function");
        }
    } finally {
        __activeBatch = false;
        for (const render of [...__dirtyBatch]) {
            render();
        }
        __dirtyBatch = new Set();
    }
}

return { state, computed, batch };

})();
