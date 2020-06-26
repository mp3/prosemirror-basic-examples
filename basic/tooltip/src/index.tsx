import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Plugin, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { exampleSetup } from 'prosemirror-example-setup'

const selectionSizePlugin = new Plugin({
  view(editorView) {
    return new SelectionSizeTooltip(editorView)
  }
})

class SelectionSizeTooltip {
  public tooltip: HTMLDivElement

  constructor(view: EditorView) {
    this.tooltip = document.createElement('div')
    this.tooltip.className = 'tooltip'
    view.dom.parentNode?.appendChild(this.tooltip)
    this.update(view, null)
  }

  update(view: EditorView, lastState: EditorState | null) {
    const state = view.state

    if (lastState?.doc.eq(state.doc) && lastState?.selection.eq(state.selection)) {
      return
    }

    if (state.selection.empty) {
      this.tooltip.style.display = 'none'
      return
    }

    this.tooltip.style.display = ''
    const { from, to } = state.selection
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const box = this.tooltip.offsetParent?.getBoundingClientRect()
    const left = Math.max((start.left + end.left) / 2, start.left + 3)
    if (!box) {
      return
    }

    this.tooltip.style.left = (left - box?.left) + 'px'
    this.tooltip.style.top = (box?.top + start.bottom) + 'px'
    this.tooltip.textContent = String(to - from)
  }

  destroy() {
    this.tooltip.remove()
  }
}

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(contentRef.current),
        plugins: exampleSetup({ schema }).concat(selectionSizePlugin)
      })
    })

    console.log(view)
  }, [])

  return (
    <div>
      <div ref={editorRef} id="editor" />
      <div ref={contentRef} style="display: none" id="content" >
        <p>Select some text to see a tooltip with the size of your selection.</p>
        <p>(That's not the most useful use of a tooltip, but it's a nicely simple example.)</p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
