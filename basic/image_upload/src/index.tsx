import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Plugin, EditorState } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { schema } from 'prosemirror-schema-basic'
import { DOMParser } from 'prosemirror-model'
import { exampleSetup } from 'prosemirror-example-setup'

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)

  const placeholderPlugin = new Plugin({
    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, set) {
        set = set.map(tr.mapping, tr.doc)
        const action = tr.getMeta(this)
        if (action?.add) {
          const widget = document.createElement('placeholder')
          const deco = Decoration.widget(action.add.pos, widget, {
            id: action.add.id
          })
          set = set.add(tr.doc, [deco])
        } else if (action?.remove) {
          set = set.remove(set.find(null, null, (spec) => spec.id === action.remove.id ))
        }

        return set
      }
    },
    props: {
      decorations(state) {
        return this.getState(state)
      }
    }
  })

  const findPlaceholder = (state: EditorState, id: number) => {
    const decos = placeholderPlugin.getState(state)
    const found = decos.find(null, null, (spec) => spec.id === id)
    return found.length ? found[0].from : null
  }

  const startImageUpload = (view: EditorView, file: File) => {
    const id: any = {}

    const tr = view.state.tr
    if (tr.selection.empty === false) {
      tr.deleteSelection()
    }
    tr.setMeta(placeholderPlugin, {
      add: {
        id,
        pos: tr.selection.from
      }
    })
    view.dispatch(tr)

    uploadFile(file).then((url) => {
      const pos = findPlaceholder(view.state, id)
      if (pos === null) {
        return
      }

      view.dispatch(
        view.state.tr
          .replaceWith(
            pos,
            pos,
            schema.nodes.image.create({ src: url })
          )
          .setMeta(placeholderPlugin, { remove: { id } })
      ), () => {
        view.dispatch(tr.setMeta(placeholderPlugin, { remove: { id } }))
      }
    })
  }

  const uploadFile = (file: File) => {
    const reader = new FileReader()
    return new Promise((accept, fail) => {
      reader.onload = () => accept(reader.result)
      reader.onerror = () => fail(reader.error)
      setTimeout(() => reader.readAsDataURL(file), 1500)
    })
  }

  
  useEffect(() => {
    const view = window.view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(contentRef.current),
        plugins: exampleSetup({ schema }).concat(placeholderPlugin)
      })
    })

    const onChangeImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement | null
      if (view.state.selection.$from.parent.inlineContent && target?.files?.length) {
        startImageUpload(view, target.files[0])
      }
      view.focus()
    }

    imageUploadRef.current.addEventListener('change', onChangeImageUpload)

    console.log(view)
  }, [])

  return (
    <div>
      <div ref={editorRef} />
      <div>Insert image: <input type="file" ref={imageUploadRef} /></div>
      <div style="display: none" ref={contentRef}>
        <p>This paragraph needs an image.</p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
