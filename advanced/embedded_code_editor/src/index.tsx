import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { EditorView } from 'prosemirror-view'
import CodeMirror from 'codemirror'
import { TextSelection, EditorState, Selection, Transaction } from 'prosemirror-state'
import { schema } from 'prosemirror-schema-basic'
import { undo, redo } from 'prosemirror-history'
import { exitCode } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { DOMParser, Schema } from 'prosemirror-model'
import { exampleSetup } from 'prosemirror-example-setup' 

class CodeBlockView {
  public node: Node
  public view: EditorView
  public incomingChanges: boolean
  public cm: CodeMirror.Editor
  public dom: HTMLElement
  public updating: boolean
  public getPos: () => number

  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.incomingChanges = false

    this.cm = new CodeMirror(null, {
      value: this.node.textContent,
      lineNumbers: true,
      extraKeys: this.codeMirrorKeymap()
    })

    this.dom = this.cm.getWrapperElement()
    setTimeout(() => this.cm.refresh(), 20)

    this.updating = false
    this.cm.on('beforeChange', () => this.incomingChanges = true)
    this.cm.on('cursorActivity', () => {
      if (this.updating === false && this.incomingChanges === false) {
        this.forwardSelection()
      }
    })
    this.cm.on('changes', () => {
      if (this.updating === false) {
        this.valueChanged()
        this.forwardSelection()
      }
      this.incomingChanges = false
    })
    this.cm.on('focus', () => this.forwardSelection())
  }

  forwardSelection() {
    if (this.cm.hasFocus() === false) {
      return
    }

    const state = this.view.state
    const selection = this.asProseMirrorSelection(state.doc)
    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection))
    }
  }

  asProseMirrorSelection(doc: any) {
    const offset = this.getPos() + 1
    const anchor = this.cm.indexFromPos(this.cm.getCursor('anchor')) + offset
    const head = this.cm.indexFromPos(this.cm.getCursor('head')) + offset
    return TextSelection.create(doc, anchor, head)
  }

  setSelection(anchor: number, head: number) {
    this.cm.focus()
    this.updating = true
    this.cm.setSelection(this.cm.posFromIndex(anchor), this.cm.posFromIndex(head))
    this.updating = false
  }

  valueChanged() {
    const change = computeChange(this.node.textContent, this.cm.getValue())
    if (change) {
      const start = this.getPos() + 1
      const tr = this.view.state.tr.replaceWith(
        start + change.from, start + change.to,
        change.text ? schema.text(change.text) : null
      )
      this.view.dispatch(tr)
    }
  }

  codeMirrorKeymap() {
    const view = this.view
    const mod = /Mac/.test(navigator.platform) ? 'Cmd' : 'Ctrl'
    return CodeMirror.normalizeKeyMap({
      Up: () => this.maybeEscape('line', -1),
      Left: () => this.maybeEscape('char', -1),
      Down: () => this.maybeEscape('line', 1),
      Right: () => this.maybeEscape('char', 1),
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch),
      'Ctrl-Enter': () => {
        if (exitCode(view.state, view.dispatch)) {
          view.focus()
        }
      }
    })
  }

  maybeEscape(unit: 'line' | 'char', dir: number) {
    const pos = this.cm.getCursor()
    if (
      this.cm.somethingSelected() ||
      pos.line !== (dir < 0 ? this.cm.firstLine() : this.cm.lastLine()) ||
      (unit === 'char' &&
      pos.ch !== (dir < 0 ? 0 : this.cm.getLine(pos.line).length)
      )
    ) {
      return CodeMirror.Pass
    }

    this.view.focus()
    const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize)
    const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
    this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView())
    this.view.focus()
  }

  update(node: Node) {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node
    const change = computeChange(this.cm.getValue(), node.textContent)

    if (change) {
      this.updating = true
      this.cm.replaceRange(change.text, this.cm.posFromIndex(change.from), this.cm.posFromIndex(change.to))
      this.updating = false
    }

    return true
  }

  selectNode() {
    this.cm.focus()
  }

  stopEvent() {
    return true
  }
}

const computeChange = (oldVal: string | null, newVal: string | null) => {
  if (oldVal === null || newVal === null || oldVal === newVal) {
    return null
  }

  let start = 0
  let oldEnd = oldVal.length
  let newEnd = newVal.length

  while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
    ++start
  }
  while (oldEnd > start && newEnd > start && oldVal.charCodeAt(oldEnd - 1) == newVal.charCodeAt(newEnd - 1)) {
    oldEnd--
    newEnd--
  }

  return {
    from: start,
    to: oldEnd,
    text: newVal.slice(start, newEnd)
  }
}

const arrowHandler = (dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward') => {
  return (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      const side = dir === 'left' || dir === 'up' ? -1 : 1
      const $head = state.selection.$head
      const nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
      if (nextPos.$head && nextPos.$head.parent.type.name === 'code_block') {
        dispatch(state.tr.setSelection(nextPos))
        return true
      }
    }
    return false
  }
}

const arrowHandlers = keymap({
  ArrowLeft: arrowHandler('left'),
  ArrowRight: arrowHandler('right'),
  ArrowUp: arrowHandler('up'),
  ArrowDown: arrowHandler('down')
})

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(contentRef.current),
        plugins: exampleSetup(schema)
      })
    })

    console.log(view)
  }, [])

  return (
    <div>
      <div ref={editorRef} />
      <div ref={contentRef}>
        <h2>
          The code block is a code editor
        </h2>
        <p>
        This editor has been wired up to render code blocks as instances of the CodeMirror code editor, which provides syntax highlighting, auto-indentation, and similar.
        </p>

        <code>
          function max(a, b) {
            return a > b ? a : b
          }
        </code>

        <p>
          The content of the code editor is kept in sync with the content of the code block in the rich text editor, so that it is as if you're directly editing the outer document, using a more convenient interface.
        </p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
