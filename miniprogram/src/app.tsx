import { useLaunch } from '@tarojs/taro'
import { initCloud } from './services/cloud'
import './app.scss'

function App(props) {
  useLaunch(() => {
    initCloud()
  })

  return props.children
}

export default App
