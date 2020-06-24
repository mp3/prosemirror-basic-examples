import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'
import { exampleSetup } from 'prosemirror-example-setup'
import { EditorState } from 'prosemirror-state'

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes as any, 'paragraph block*', 'block'),
    marks: schema.spec.marks
  })

  useEffect(() => {
    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(contentRef.current),
        plugins: exampleSetup({
          schema: mySchema
        })
      })
    })
    
    console.log(view)
  }, [])

  return (
    <div>
      <div ref={editorRef} id="editor" />
      <div ref={contentRef} style="display: none;" >Hello, ProseMirror</div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
