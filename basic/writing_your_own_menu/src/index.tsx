import { h, render } from 'preact'
import { EditorView } from 'prosemirror-view'

class MenuView {
  public editorView: EditorView
  public dom: HTMLDivElement
  public items: any[]

  constructor(items: any[], editorView: EditorView) {
    this.items = items
    this.editorView = editorView

    this.dom = document.createElement('div')
    this.dom.className = 'menubar'
    items.forEach(({ dom }) => this.dom.appendChild(dom))
    this.update()

    this.dom.addEventListener('mousedown', (event) => {
      event.preventDefault()
      editorView.focus()
      items.forEach(({ command, dom }) => {
        if (dom.contains(event.target)) {
          command(editorView.state, editorView.dispatch, editorView)
        }
      })
    })
  }

  update() {
    this.items.forEach(({ command, dom }) => {
      const active = command(this.editorView.state, null, this.editorView)
      dom.style.display = active ? '' : 'none'
    })
  }

  destroy() {
    this.dom.remove()
  }
}

const Main = () => {
  return (
    <div>examples</div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
