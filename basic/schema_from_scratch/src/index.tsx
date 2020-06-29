import { h, render } from 'preact'
import { Schema } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { findWrapping } from 'prosemirror-transform'

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

const Main = () => {


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

  return (
    <div>examples</div>
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
