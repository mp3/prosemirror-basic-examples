import { h, render } from 'preact'

const Main = () => {
  return (
    <div>examples</div>
  )
}

const root = document.getElementById('root')

if (root) {
  render(<Main />, root)
}
