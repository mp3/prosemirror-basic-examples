import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Schema, DOMParser } from 'prosemirror-model'
import { EditorState, Transaction, Plugin } from 'prosemirror-state'
import { findWrapping } from 'prosemirror-transform'
import { keymap } from 'prosemirror-keymap'
import { toggleMark, baseKeymap } from 'prosemirror-commands'
import { undo, redo, history } from 'prosemirror-history'
import { EditorView } from 'prosemirror-view'

const textSchema = new Schema({
  nodes: {
    text: {},
    doc: {
      content: 'text*'
    }
  }
})

const noteSchema = new Schema({
  nodes: {
    text: {},
    note: {
      content: 'text*',
      toDOM() {
        return ['note', 0]
      },
      parseDOM: [
        {
          tag: 'note'
        }
      ]
    },
    notegroup: {
      content: 'note+',
      toDOM() {
        return ['notegroup', 0]
      },
      parseDOM: [
        {
          tag: 'notegroup'
        }
      ]
    },
    doc: {
      content: '(note | notegroup)+'
    }
  }
})

const starSchema = new Schema({
  nodes: {
    text: {
      group: 'inline'
    },
    star: {
      inline: true,
      group: 'inline',
      toDOM() {
        return ['star', '🟊']
      },
      parseDOM: [
        {
          tag: 'star'
        }
      ]
    },
    paragraph: {
      group: 'block',
      content: 'inline',
      toDOM() {
        return ['p', 0]
      },
      parseDOM: [
        {
          tag: 'p'
        }
      ]
    },
    boring_paragraph: {
      group: 'block',
      content: 'inline',
      toDOM() {
        return ['p', 0]
      },
      parseDOM: [
        {
          tag: 'p'
        }
      ]
    },
    doc: {
      content: 'block*'
    }
  },
  marks: {
    shouting: {
      toDOM() {
        return ['shouting', 0]
      },
      parseDOM: [
        {
          tag: 'shouting'
        }
      ]
    },
    link: {
      attrs: {
        href: {}
      },
      toDOM(node) {
        return [
          'a',
          {
            href: node.attrs.href
          },
          0
        ]
      },
      parseDOM: [
        {
          tag: 'a',
          getAttrs(dom) {
            return {
              href: (dom as HTMLAnchorElement).href
            }
          }
        }
      ],
      inclusive: false
    }
  }
})

const toggleLink = (state: EditorState, dispatch: (tr: Transaction) => void) => {
  const { doc, selection } = state
  if (selection.empty === true) {
    return false
  }

  const attrs = (() => {
    if (doc.rangeHasMark(selection.from, selection.to, starSchema.marks.link) === false) {
      return {
        href: prompt('Link to where?', '')
      }
    }

    return null
  })()

  if (!attrs?.href) {
    return false
  }

  return toggleMark(starSchema.marks.link, attrs)(state, dispatch)
}

const insertStar = (state: EditorState, dispatch: (tr: Transaction) => void) => {
  const type = starSchema.nodes.star
  const { $from } = state.selection

  if ($from.parent.canReplaceWith($from.index(), $from.index(), type) === false) {
    return false
  }

  dispatch(state.tr.replaceSelectionWith(type.create()))
  
  return true
}

const starKeymap = keymap({
  'Ctrl-b': toggleMark(starSchema.marks.shouting),
  'Ctrl-q': toggleLink,
  'Ctrl-Space': insertStar
})

const makeNoteGroup = (state: EditorState, dispatch: Function) => {
  const range = state.selection.$from.blockRange(state.selection.$to)
  if (!range) {
    return false
  }

  const wrapping = findWrapping(range, noteSchema.nodes.notegroup)
  if (!wrapping) {
    return false
  }

  dispatch?.(state.tr.wrap(range, wrapping).scrollIntoView())

  return true
}

const historyKeymap = keymap({
  'Mod-z': undo,
  'Mod-y': redo
})

const start = (place: HTMLElement, content: HTMLElement, schema: Schema, plugins: Plugin[] = []) => {
  const doc = DOMParser.fromSchema(schema).parse(content)
  return new EditorView(place, {
    state: EditorState.create({
      doc,
      plugins: plugins.concat([historyKeymap, keymap(baseKeymap), history()])
    })
  })
}

const Main = () => {
  const textEditorRef = useRef<HTMLDivElement>(null)
  const noteEditorRef = useRef<HTMLDivElement>(null)
  const starEditorRef = useRef<HTMLDivElement>(null)
  const textContentRef = useRef<HTMLDivElement>(null)
  const noteContentRef = useRef<HTMLDivElement>(null)
  const starContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    start(textEditorRef.current, textContentRef.current, textSchema)
    start(noteEditorRef.current, noteContentRef.current, noteSchema, [keymap({'Mod-Space': makeNoteGroup})])
    start(starEditorRef.current, starContentRef.current, starSchema, [starKeymap])
  }, [])

  return (
    <div>
      <p>Inline editor: <span ref={textEditorRef} id="text-editor"></span></p>
      <div ref={noteEditorRef} id="note-editor" />
      <div ref={starEditorRef} id="star-editor" class="editor" />
      <div style="display: none">
        <div ref={textContentRef} id="text-content">
          Such as this sentence.
        </div>
        <div ref={noteContentRef} id="note-content">
          <note>Do laundry</note>
          <note>Water the tomatoes</note>
          <notegroup>
            <note>Buy flour</note>
            <note>Get toilet paper</note>
          </notegroup>
        </div>
        <div ref={starContentRef} id="star-content">
          <p>This is a <star></star>nice<star></star> paragraph, it can have <shouting>anything</shouting> in it.</p>
          <p className="boring">This paragraph is boring, it can't have anything.</p>
          <p>Press ctrl/cmd-space to insert a star, ctrl/cmd-b to toggle shouting, and ctrl/cmd-q to add or remove a link.</p>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
