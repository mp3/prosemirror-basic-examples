import { h, render } from 'preact'
import { useRef, useEffect } from 'preact/hooks'

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

const Main = () => {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

  }, [])

  return (
    <div ref={editorRef} />
  )
}

const root = document.getElementById('root')

if (root) [
  render(<Main />, root)
]
