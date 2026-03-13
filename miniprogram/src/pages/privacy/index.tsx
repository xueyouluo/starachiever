import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

export default function PrivacyPage() {
  return (
    <View className='privacy-page'>
      <ScrollView scrollY className='scroll-view'>
        <View className='content'>
          <Text className='title'>隐私政策</Text>
          <Text className='update-date'>最后更新：2026年3月13日</Text>

          <Text className='section-title'>一、概述</Text>
          <Text className='paragraph'>
            StarAchiever（以下简称"本应用"）是一款面向家庭使用的儿童任务积分管理工具。我们非常重视用户隐私，本政策说明我们如何收集、使用和保护您的信息。
          </Text>

          <Text className='section-title'>二、收集的信息</Text>
          <Text className='paragraph'>本应用仅收集以下必要信息：</Text>
          <Text className='list-item'>• 微信 OpenID：用于唯一标识用户，实现云端数据同步。OpenID 不包含您的微信昵称、头像等个人信息。</Text>
          <Text className='list-item'>• 应用数据：您在应用中创建的孩子信息（姓名、头像表情）、任务、奖励、积分记录等内容。</Text>

          <Text className='section-title'>三、信息的使用</Text>
          <Text className='paragraph'>收集的信息仅用于：</Text>
          <Text className='list-item'>• 将您的应用数据同步保存到微信云开发数据库，以便在更换设备后恢复数据。</Text>
          <Text className='list-item'>• 本应用不会将您的任何数据用于广告、推送或其他商业目的。</Text>

          <Text className='section-title'>四、信息的存储与安全</Text>
          <Text className='paragraph'>
            您的数据存储在微信云开发（CloudBase）平台，受微信官方安全体系保护。数据仅限您本人的微信账号访问，其他用户无法查看您的数据。
          </Text>

          <Text className='section-title'>五、第三方共享</Text>
          <Text className='paragraph'>
            我们不会向任何第三方出售、出租或共享您的个人信息。数据存储服务由腾讯微信云开发提供，受腾讯隐私政策约束。
          </Text>

          <Text className='section-title'>六、数据删除</Text>
          <Text className='paragraph'>
            您可以随时通过"家长模式 → 数据管理 → 从云端恢复"查看云端数据。如需删除云端数据，请联系开发者。本地数据可通过删除小程序清除。
          </Text>

          <Text className='section-title'>七、儿童隐私</Text>
          <Text className='paragraph'>
            本应用面向家长使用，由家长代为操作。应用内的孩子信息（如姓名）由家长自行填写和管理，建议使用昵称而非真实姓名。
          </Text>

          <Text className='section-title'>八、联系我们</Text>
          <Text className='paragraph'>
            如您对本隐私政策有任何疑问，可通过微信小程序反馈功能联系我们。
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
