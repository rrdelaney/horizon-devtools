import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { createDevTools } from './devTools'

let root = document.getElementById('root')

let DevTools = createDevTools(horizon)

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loaded: false,
      posts: []
    }

    horizon('posts').watch().subscribe(posts => {
      this.setState({ posts, loaded: true })
    })
  }

  render () {
    return <div>
      <h1>Posts</h1>
      {this.state.posts.map(p => <li key={p.time.toISOString()}>{p.message} - <small>{p.time.toISOString()}</small></li>)}
    </div>
  }
}

ReactDOM.render(<div>
  <App />
  <DevTools />
</div>, root)
