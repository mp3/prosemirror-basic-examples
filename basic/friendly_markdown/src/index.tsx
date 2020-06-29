import { h, render } from 'preact'
import { useRef, useEffect } from 'preact/hooks'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { defaultMarkdownParser, schema, defaultMarkdownSerializer } from 'prosemirror-markdown'
import { exampleSetup } from 'prosemirror-example-setup'

class MarkdownView {
  public textarea: HTMLTextAreaElement

  constructor(target: Node, content: string) {
    this.textarea = target.appendChild(document.createElement('textarea'))
    this.textarea.value = content
  }

  get content() {
    return this.textarea.value
  }

  focus() {
    this.textarea.focus()
  }

  destroy() {
    this.textarea.remove()
  }
}

class ProseMirrorView {
  public view: EditorView

  constructor(target: Node, content: string) {
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content),
        plugins: exampleSetup(schema)
      })
    })
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc)
  }

  focus() {
    this.view.focus()
  }

  destroy() {
    this.view.destroy()
  }
}

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    let view: MarkdownView | ProseMirrorView = new MarkdownView(editorRef.current, contentRef.current.value)

    const onClickButton = (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target?.checked === false) {
        return
      }

      const View = target.value === 'markdown' ? MarkdownView : ProseMirrorView
      if (view instanceof View) {
        return
      }

      const content = view.content

      view.destroy()
      view = new View(editorRef.current, content)
      view.focus()
    }
  }, [])

  return (
    <div ref={editorRef} />
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
