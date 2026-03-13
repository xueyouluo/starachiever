export default {
  cloud: true,
  pages: [
    'pages/index/index',
    'pages/calendar/index',
    'pages/profile/index',
    'pages/select-child/index',
    'pages/parent/index',
    'pages/privacy/index'
  ],
  lazyCodeLoading: 'requiredComponents',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'StarAchiever',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#FF6B6B',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '任务'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
}
