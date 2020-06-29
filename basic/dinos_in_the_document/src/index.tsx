import { h, render } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { Schema, DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { EditorState } from 'prosemirror-state'
import { MenuItem } from 'prosemirror-menu'
import { buildMenuItems, exampleSetup } from 'prosemirror-example-setup'
import { EditorView } from 'prosemirror-view'

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const dinos = [
      "brontosaurus",
      "stegosaurus",
      "triceratops",
      "tyrannosaurus",
      "pterodactyl"
    ]
  
    const dinoNodeSpec = {
      attrs: {
        type: {
          default: "brontosaurus"
        }
      },
      inline: true,
      group: 'inline',
      draggable: true,
      toDOM: (node) => ['img', {
        'dino-type': node.attrs.type,
        src: `/img/dino/${node.attrs.type}.png`,
        title: node.attrs.type,
        class: 'dinosaur'
      }],
      parseDOM: [{
        tag: 'img[dino-type]',
        getAttrs: (dom: HTMLElement) => {
          const type = dom.getAttribute('dino-type')
          return dinos.includes('type') ? { type } : false
        }
      }]
    }
  
    const dinoSchema = new Schema({
      nodes: schema.spec.nodes.addBefore('image', 'dino', dinoNodeSpec),
      marks: schema.spec.marks
    })
  
    const startDoc = DOMParser.fromSchema(dinoSchema).parse(contentRef.current)
  
    const dinoType = dinoSchema.nodes.dino
  
    const insertDino = (type: string) => {
      return (state: EditorState, dispatch?: Function) => {
        const { $from } = state.selection
        const index = $from.index()
  
        if ($from.parent.canReplaceWith(index, index, dinoType) === false) {
          return false
        }
  
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(dinoType.create({ type })))
        }
  
        return true
      }
    }
  
    const menu = buildMenuItems(dinoSchema)
    dinos.forEach((name) => {
      menu.insertMenu.content.push(new MenuItem({
        title: `Insert ${name}`,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        enable: (state) => insertDino(name)(state),
        run: insertDino(name)
      }))
    })
    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: startDoc,
        plugins: exampleSetup({
          schema: dinoSchema,
          menuContent: menu.fullMenu
        })
      })
    })

    console.log(view)
  }, [])

  return (
    <div>
      <div ref={editorRef} />
      <div ref={contentRef} style="display: none;" >
        <p>This is your dinosaur-enabled editor. The insert menu allows you to insert dinosaurs.</p>
        <p>
          This paragraph <img className='dinosaur' dino-type="stegosaurus" />, for example,
          <img className='dinosaur' dino-type="triceratops" />
          is full <img className='dinosaur' dino-type="tyrannosaurus" /> of
          dinosaurs.
        </p>
        <p>Dinosaur nodes can be selected, copied, pasted, dragged, and so on.</p>
      </div>
    </div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
