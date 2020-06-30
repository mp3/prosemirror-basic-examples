import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { EditorView } from 'prosemirror-view'
import { Plugin, EditorState } from 'prosemirror-state'
import { setBlockType, toggleMark, wrapIn, baseKeymap } from 'prosemirror-commands'
import { schema } from 'prosemirror-schema-basic'
import { DOMParser } from 'prosemirror-model'
import { keymap } from 'prosemirror-keymap'

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

const menuPlugin = (items) => {
  return new Plugin({
    view(editorView: EditorView) {
      const menuView = new MenuView(items, editorView)
      editorView.dom.parentNode?.insertBefore(menuView.dom, editorView.dom)
      return menuView
    }
  })
}

const icon = (text: string, name: string) => {
  const span = document.createElement('span')
  span.className = `menuicon ${name}`
  span.title = name
  span.textContent = text
  return span
}

const heading = (level: number) => {
  return {
    command: setBlockType(schema.nodes.heading, { level }),
    dom: icon(`H${level}`, 'heading')
  }
}

const menu = menuPlugin([
  {
    command: toggleMark(schema.marks.strong),
    dom: icon('B', 'strong')
  },
  {
    command: toggleMark(schema.marks.em),
    dom: icon('i', 'em')
  },
  {
    command: setBlockType(schema.nodes.paragraph),
    dom: icon('p', 'paragraph')
  },
  heading(1),
  heading(2),
  heading(3),
  {
    command: wrapIn(schema.nodes.blockquote),
    dom: icon('>', 'blockquote')
  }
])

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(contentRef.current),
        plugins: [keymap(baseKeymap), menu]
      })
    })

    console.log(view)
  })

  return (
    <div>
      <div ref={editorRef} />
      <div ref={contentRef} style="display: none">
        <h3>Simple editor</h3>
        <p>With a very crude menu bar.</p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
