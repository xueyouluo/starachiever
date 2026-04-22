export default {
  cloud: true,
  pages: [
    'pages/index/index',
    'pages/calendar/index',
    'pages/rewards/index',
    'pages/profile/index',
    'pages/pet/index',
    'pages/select-child/index',
    'pages/parent/index',
    'pages/privacy/index'
  ],
  lazyCodeLoading: 'requiredComponents',
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#F6F4EE',
    navigationBarTitleText: 'StarAchiever',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#8E8E93',
    selectedColor: '#0A84FF',
    backgroundColor: '#F7F7FA',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '任务',
        iconPath: 'assets/icons/tab-task.png',
        selectedIconPath: 'assets/icons/tab-task-active.png'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历',
        iconPath: 'assets/icons/tab-calendar.png',
        selectedIconPath: 'assets/icons/tab-calendar-active.png'
      },
      {
        pagePath: 'pages/rewards/index',
        text: '奖励',
        iconPath: 'assets/icons/tab-rewards.png',
        selectedIconPath: 'assets/icons/tab-rewards-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/tab-profile.png',
        selectedIconPath: 'assets/icons/tab-profile-active.png'
      },
      {
        pagePath: 'pages/pet/index',
        text: '宠物',
        iconPath: 'assets/icons/tab-pet.png',
        selectedIconPath: 'assets/icons/tab-pet-active.png'
      }
    ]
  }
}
