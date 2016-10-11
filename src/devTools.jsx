import React, { Component } from 'react'
import JSONTree from 'react-json-tree'
import Dock from 'react-dock'

// This should be replaced with Horizon 2's `query.toString()` method
const ast2string = (ast, live) => {
  // All queries except `find` are an array, so we normalize `find` here to be an array
  if (ast.find) ast.find = [ast.find]
  return ['find', 'find_all', 'above', 'below', 'order', 'limit'].reduce(
    (res, key) => res + (!ast[key] ? '' : `.${key}(${JSON.stringify(ast[key][0]).replace(/[\[\]"\{\}]/g, '')})`),
    (live === 'watch' ? '🔄 ' : '') + ast.collection
  )
}

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

const Button = ({ onClick, children }) =>
  <span onClick={onClick} style={{
    flexGrow: '1',
    cursor: 'pointer',
    textAlign: 'center',
    color: theme.base07,
    backgroundColor: theme.base08,
    borderRadius: '3px',
    margin: '5px',
    padding: '5px 0',
    textDecoration: 'underline'
  }}>
    {children}
  </span>

const ButtonTabs = ({ onClick }) =>
  <div style={{ display: 'flex' }}>
    <Button onClick={() => onClick('query')}>Query</Button>
    <Button onClick={() => onClick('user')}>User</Button>
    {/* <Button onClick={() => onClick('feed')}>Feed</Button> */}
  </div>

const Logo = () =>
  <span>
    <img src='http://horizon.io/images/horizon-logo.png' style={{ maxWidth: '200px', width: '50%' }} />
    <span style={{ color: '#5e5e5e' }}>[DEV TOOLS]</span>
  </span>

const QueryView = ({ queries }) =>
  <JSONTree
    data={queries}
    theme={theme}
    invertTheme={false}
    hideRoot={true}
  />

const UserView = ({ user }) =>
  user === null
    ? <div style={{ color: theme.base01, margin: '.5em' }}>No user exists</div>
    : <JSONTree
      data={user}
      theme={theme}
      invertTheme={false}
      hideRoot={true}
    />

export function createDevTools (horizon) {
  let devtools = instrument(horizon)
  if (typeof window !== 'undefined') window.devtools = devtools

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
        user: {},
        queryText: '',
        queryTextError: false,
        currentTab: 'query'
      }
    }

    componentDidMount () {
      if (typeof window !== 'undefined') window.addEventListener('keydown', this.handleKeyDown)

      horizon.currentUser().watch().subscribe(user => {
        this.setState({ user })
      }, () => {
        this.setState({ user: null })
      })

      devtools.update = () => {
        this.setState({ queries: devtools.queries })
      }
    }

    componentWillUnmount () {
      if (typeof window !== 'undefined') window.removeEventListener('keydown', this.handleKeyDown)
      devtools.update = () => null
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
        <pre style={{ padding: '10px', width: 'calc(100% - 20px)', height: '90%', margin: 0, backgroundColor: theme.base00 }}>
          <Logo />
          <hr style={{ borderStyle: 'solid', color: '#5e5e5e' }} />

          <ButtonTabs onClick={currentTab => this.setState({ currentTab })} />

          <div style={{ overflow: 'auto', height: '100%' }}>
            {this.state.currentTab === 'query'
              ? <QueryView queries={this.state.queries} />
              : this.state.currentTab === 'user'
              ? <UserView user={this.state.user} />
              : null
            }
          </div>
        </pre>
        <textarea
          onChange={this.handleQueryTextUpdate}
          value={this.state.queryText}
          onKeyUp={this.shouldRunQuery}
          placeholder='Write a query using `horizon`. Run with ^ + Enter.'
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
