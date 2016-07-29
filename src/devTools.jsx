import React, { Component } from 'react'
import JSONTree from 'react-json-tree'
import Dock from 'react-dock'

const ast2string = (ast, live) =>
  ['find', 'find_all', 'above', 'below', 'order', 'limit'].reduce(
    (res, key) => res + (!ast[key] ? '' : `.${key}(${JSON.stringify(ast[key][0]).replace(/[\[\]\"\{\}]/g, '')})`),
    (live === 'watch' ? '🔄 ' : '') + ast.collection
  )

let positions = ['left', 'top', 'right', 'bottom']
let nextPosition = c => positions[(positions.indexOf(c) + 1) % 4]

function instrument (horizon) {
  let observ = {
    queries: {},
    update: () => null
  }

  Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).fetch =
    new Proxy(Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).fetch, {
      apply (_fetch, thisArg) {
        return _fetch.bind(thisArg)().map(c => {
          observ.queries[ast2string(thisArg._query, 'fetch')] = c
          observ.update()
          return c
        })
      }
    })

  Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).watch =
    new Proxy(Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).watch, {
      apply (_watch, thisArg, args) {
        return _watch.bind(thisArg)(...args).map(c => {
          observ.queries[ast2string(thisArg._query, 'watch')] = c
          observ.update()
          return c
        })
      }
    })

    return observ
}

export function createDevTools (horizon) {
  let devtools = instrument(horizon)
  window.devtools = devtools

  return class HzDevTools extends Component {
    constructor (props) {
      super(props)

      this.handleKeyDown = this.handleKeyDown.bind(this)

      this.state = {
        visible: props.defaultVisible || true,
        position: props.defaultPosition || 'right',
        queries: devtools.queries
      }

      devtools.update = () => {
        this.setState({ queries: devtools.queries })
      }
    }

    componentDidMount() {
      window.addEventListener('keydown', this.handleKeyDown)
    }

    componentWillUnmount() {
      window.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown (e) {
      let char = String.fromCharCode(e.keyCode || e.which)
      if (char.toUpperCase() === 'Q' && e.ctrlKey) this.setState({ visible: !this.state.visible })
      if (char.toUpperCase() === 'W' && e.ctrlKey) this.setState({ position: nextPosition(this.state.position) })
    }

    render () {
      return <Dock position={this.state.position} isVisible={this.state.visible} dimMode='none'>
        <pre>
          <JSONTree data={this.state.queries} />
        </pre>
      </Dock>
    }
  }
}
