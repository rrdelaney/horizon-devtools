# Horizon Devtools

> A better dev experience for Horizon users

## Demo

## Installation

```
npm install --save horizon-devtools
```

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

## Guide

The devtools will track any query you make through Horizon after the tools are
initialized with `createDevTools`. If the query ends with `fetch()` the devtools
will display the result of that query. If `watch()` is used 🔄 will
show next to the query and be live updated with the results.

`⌃ + Q` will show/hide the devtools.

`⌃ + W` will change the position of the devtools.

You can run custom queries using the query editor in the devtools. Type in a
query into the bottom text box and press `⌃ + Enter` to run it. The horizon
instance will be bound to `horizon`. If a query excludes `fetch()` or `watch()`,
`fetch()` will be automatically appended. If a query excludes `subscribe()`,
`subscribe()` will be automatically appended. For example, if `horizon('users')`
is entered, `horizon('users').fetch().subscribe()` will be run.

## API

### `createDevTools(horizon): DevTools`

Attaches instrumentation for monitoring on the horizon instance. It returns
a `DevTools` component hooked up to the instrumentation that automatically
updates.

### `<DevTools defaultVisible={true} defaultPosition='right' />`

This renders the developer tools into the window. If `defaultVisible` is set
to false, the tools will not be open at first. `defaultPosition` can be either
`left`, `right`, `top`, or `bottom`.

## Contributing

To run the example use `npm run dev` and go to `localhost:8181`.

To build for publishing run `npm run build`.
