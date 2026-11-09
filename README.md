# HandleStateJS

Lightweight dynamic rendering library with state changes

## Importation

Import the library utilities using `ESM` syntax
```js
import { state, computed, batch } from "./handlestate.mjs";
```

## Usage

You can use the library's primitives to add reactivity to your applications

### state

Create a state manager
```js
const count = state(0);
count.connect(() => {
    // Runs after every update
    console.log(count.get());
});

count.set(v => ++v);
// Output:
// >> 0
// >> 1
```

### computed

Create a derived state

```js
const count = state(0);
const double = computed(() => count.get() * 2);
double.connect(() => {
    // Runs after every update
    console.log(double.get());
});
 
count.set(v => ++v);
// Output:
// >> 0
// >> 2
```

### batch

Group multiple state updates into a single render pass

```js
const a = state(0);
const b = state(0);

const render = () => {
    // Runs after every update
    console.log(a.get(), b.get());
};

render(); // First render
a.connect(render, {
    firstRender: false
});
b.connect(render, {
    firstRender: false
});

batch(() => {
    a.set(v => ++v);
    b.set(v => ++v);
});

// Output:
// >> 0 0
// >> 1 1
```

## Documentation

*View JSDoc in `handlestate.mjs` file for more informations*
