import { h, render } from 'preact'
import { Plugin, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

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
    this.tooltip.style.bottom = (box?.bottom - start.top) + 'px'
    this.tooltip.textContent = String(to - from)
  }

  destroy() {
    this.tooltip.remove()
  }
}

const Main = () => {
  return (
    <div>examples</div>
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
