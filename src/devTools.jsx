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

const theme = {
  base00: '#1B2B34',
  base01: '#EC5F67',
  base03: '#99C794',
  base06: '#FAC863',
  base05: '#6699CC',
  base04: '#C594C5',
  base02: '#5FB3B3',
  base07: '#A7ADBA',
  base08: '#4F5B66',
  base09: '#EC5F67',
  base0A: '#99C794',
  base0B: '#FAC863',
  base0D: '#6699CC',
  base0C: '#C594C5',
  base0E: '#5FB3B3',
  base0F: '#D8DEE9'
}

function instrument (horizon) {
  let observ = {
    queries: {},
    update: () => null
  }

  Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).fetch =
    new Proxy(Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).fetch, {
      apply (_fetch, thisArg) {
        let queryName = ast2string(thisArg._query, 'fetch')
        return _fetch.bind(thisArg)().map(c => {
          observ.queries[queryName] = c
          observ.update(queryName, c)
          return c
        })
      }
    })

  Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).watch =
    new Proxy(Object.getPrototypeOf(Object.getPrototypeOf(horizon('users'))).watch, {
      apply (_watch, thisArg, args) {
        let queryName = ast2string(thisArg._query, 'watch')
        return _watch.bind(thisArg)(...args).map(c => {
          observ.queries[queryName] = c
          observ.update(queryName, c, 'watch')
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
      this.handleQueryTextUpdate = this.handleQueryTextUpdate.bind(this)
      this.shouldRunQuery = this.shouldRunQuery.bind(this)

      this.state = {
        visible: props.defaultVisible || true,
        position: props.defaultPosition || 'right',
        queries: devtools.queries,
        queryText: '',
        queryTextError: false,
        lastUpdate: null
      }

      devtools.update = lastUpdate => {
        this.setState({ queries: devtools.queries, lastUpdate })
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

    handleQueryTextUpdate (e) {
      this.setState({ queryText: e.target.value, queryTextError: false })
    }

    shouldRunQuery (e) {
      if (e.keyCode === 13 && e.ctrlKey) {
        this.setState({ queryText: '' })
        this.runQuery(this.state.queryText)

        return false
      }
    }

    runQuery (query) {
      try {
        let q = eval(query)
        if (q.fetch) { q = q.fetch() }
        if (q.subscribe) { q = q.subscribe() }
        this.setState({ queries: devtools.queries })
      } catch (e) {
        this.setState({ queryTextError: true, queryText: e })
      }
    }

    render () {
      return <Dock position={this.state.position} isVisible={this.state.visible} dimMode='none'>
        <pre style={{ padding: '10px', width: '100%', height: '100%', margin: 0, overflow: 'auto', backgroundColor: theme.base00 }}>
          <span>
            <img src='http://horizon.io/images/horizon-logo.png' style={{ maxWidth: '200px', width: '50%' }} />
            <span style={{ color: '#5e5e5e' }}>[DEV TOOLS]</span>
          </span>
          <hr style={{ borderStyle: 'solid', color: '#5e5e5e' }} />
          <JSONTree
            data={this.state.queries}
            theme={theme}
            invertTheme={false}
            hideRoot={true}
            labelRenderer={([label]) =>
              label === this.state.lastUpdate
                ? <span style={{ color: theme.base09 }}>{label}:</span>
                : <span>{label}:</span>
            }
          />
        </pre>
        <textarea
          onChange={this.handleQueryTextUpdate}
          value={this.state.queryText}
          onKeyUp={this.shouldRunQuery}
          placeholder='Write a query using `horizon`. Run with ⌃ + ⏎.'
          style={{ color: this.state.queryTextError ? 'red' : undefined,
                   padding: '5px',
                   position: 'absolute',
                   bottom: '0',
                   width: '97.2%',
                   resize: 'none',
                   height: '10%',
                   fontSize: '12pt',
                   fontFamily: 'monospace'
          }}
        />
      </Dock>
    }
  }
}
