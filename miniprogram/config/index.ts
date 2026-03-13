import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'starachiever-miniprogram',
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false
    }
  },
  cache: {
    enable: false
  },
  plugins: ['@tarojs/plugin-platform-weapp'],
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  webpackChain(chain, webpack) {
    chain.resolve.alias.set('@', __dirname + '/../src')
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          propList: ['*', '!font-size']
        }
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: ['nutui-react-taro'],
    postcss: {
      autoprefixer: {
        enable: true
      }
    }
  }
})
