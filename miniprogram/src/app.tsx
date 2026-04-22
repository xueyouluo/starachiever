import { useLaunch } from '@tarojs/taro'
import type { PropsWithChildren } from 'react'
import { initCloud } from './services/cloud'
import './app.scss'

function App(props: PropsWithChildren) {
  useLaunch(() => {
    initCloud()
  })

  return props.children
}

export default App
