# Horizon Devtools

> A better dev experience for Horizon users

```
npm install --save horizon-devtools
```



## Demo


## Usage

```js
// Require the dependencies
import React from 'react'
import ReactDOM from 'react-dom'
import { createDevTools } from 'horizon-devtools'
import App from './App'

// Create your horizon instance
let horizon = Horizon()
horizon.connect()

// Run the `createDevTools` function on your horizon instance
// This returns a `DevTools` component to render into your react app
let DevTools = createDevTools(horizon)

// Render your app!
ReactDOM.render(<div>
  <DevTools />
  <App />
</div>, document.getElementById('root'))
```

## API

### `createDevTools(horizon): DevTools`

Attaches instrumentation for monitoring on the horizon instance. It returns
a `DevTools` component hooked up to the instrumentation that automatically
updates.

### `<DevTools defaultVisible={true} defaultPosition='right' />`

This renders the developer tools into the window. If `defaultVisible` is set
to false, the tools will not be open at first. `defaultPosition` can be either
`left`, `right`, `top`, or `bottom`.
