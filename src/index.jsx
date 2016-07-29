import React from 'react'
import ReactDOM from 'react-dom'
import { createDevTools } from './devTools'

let root = document.getElementById('root')

let DevTools = createDevTools(horizon)

ReactDOM.render(<DevTools />, root)
