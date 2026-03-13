import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { useStore } from '../../store'
import { createDefaultChild } from '../../constants'
import { DEFAULT_CATEGORIES } from '../../constants/categories'
import { syncToCloud, restoreFromCloud } from '../../services/cloud'
import { getData } from '../../services/storage'
import './index.scss'

export default function ParentPage() {
  const { activeChild, children, importData, updateChild, addChild, deleteChild, addTask, updateTask, deleteTask, addReward, updateReward, deleteReward, addCategory, updateCategory, deleteCategory, archiveCategory, setActiveChild } = useStore()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentTab, setCurrentTab] = useState('members')
  const [selectedChildId, setSelectedChildId] = useState(activeChild?.id || '')
  const [customTaskName, setCustomTaskName] = useState('')
  const [customTaskPoints, setCustomTaskPoints] = useState('10')
  const [customRewardName, setCustomRewardName] = useState('')
  const [customRewardCost, setCustomRewardCost] = useState('50')
  const [showCustomTask, setShowCustomTask] = useState(false)
  const [showCustomReward, setShowCustomReward] = useState(false)
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('')

  useLoad(() => {
    const savedPassword = Taro.getStorageSync('parent_password')
    if (!savedPassword) {
      setPasswordModal()
    }
    if (activeChild) {
      setSelectedChildId(activeChild.id)
    }
  })

  const setPasswordModal = () => {
    Taro.showModal({
      title: '设置家长密码',
      content: '请输入4位数字密码',
      editable: true,
      placeholderText: '例如：1234',
      success: (res) => {
        if (res.confirm && res.content) {
          const pwd = res.content.trim()
          if (/^\d{4}$/.test(pwd)) {
            Taro.setStorageSync('parent_password', pwd)
            setIsAuthenticated(true)
            Taro.showToast({ title: '密码设置成功', icon: 'success' })
          } else {
            Taro.showToast({ title: '密码格式错误', icon: 'none' })
          }
        }
      }
    })
  }

  const verifyPassword = () => {
    const savedPassword = Taro.getStorageSync('parent_password')
    if (password === savedPassword) {
      setIsAuthenticated(true)
      setPassword('')
    } else {
      Taro.showToast({ title: '密码错误', icon: 'none' })
    }
  }

  // 获取当前操作的孩子
  const getOperatingChild = () => {
    if (currentTab === 'members') return null
    const child = children.find(c => c.id === selectedChildId)
    if (!child) {
      Taro.showToast({ title: '请先选择孩子', icon: 'none' })
      return null
    }
    // 设置为活跃孩子
    if (activeChild?.id !== child.id) {
      setActiveChild(child)
    }
    return child
  }

  // 切换操作的孩子
  const handleChildSelect = (childId) => {
    setSelectedChildId(childId)
    const child = children.find(c => c.id === childId)
    if (child) {
      setActiveChild(child)
    }
  }

  // 成员管理
  const handleAddChild = () => {
    Taro.showModal({
      title: '添加孩子',
      content: '请输入孩子姓名',
      editable: true,
      placeholderText: '例如：小明',
      success: (res) => {
        if (res.confirm && res.content) {
          const name = res.content.trim()
          if (!name) return

          const boyAvatars = ['👦', '🧒', '👶']
          const girlAvatars = ['👧', '👧‍🦱', '🧒‍♀️']

          Taro.showActionSheet({
            itemList: ['👦 男孩', '👧 女孩'],
            success: (genderRes) => {
              const avatars = genderRes.tapIndex === 0 ? boyAvatars : girlAvatars
              const label = genderRes.tapIndex === 0 ? '男孩' : '女孩'
              Taro.showActionSheet({
                itemList: avatars.map(a => `${a} ${label}`),
                success: async (avatarRes) => {
                  const selectedAvatar = avatars[avatarRes.tapIndex]
                  const newChild = createDefaultChild(name, selectedAvatar)
                  await addChild(newChild)
                  setSelectedChildId(newChild.id)
                  setActiveChild(newChild)
                  Taro.showToast({ title: '添加成功', icon: 'success' })
                },
                fail: () => {}
              })
            },
            fail: () => {}
          })
        }
      }
    })
  }

  const handleEditChild = (child) => {
    Taro.showModal({
      title: '编辑孩子',
      content: '请输入新姓名',
      editable: true,
      placeholderText: child.name,
      success: async (res) => {
        if (res.confirm && res.content) {
          const newName = res.content.trim()
          if (newName) {
            await updateChild({ ...child, name: newName })
            Taro.showToast({ title: '修改成功', icon: 'success' })
          }
        }
      }
    })
  }

  const handleEditPoints = (child) => {
    Taro.showModal({
      title: '编辑积分',
      content: `当前积分：${child.totalPoints}，请输入新的积分值`,
      editable: true,
      placeholderText: String(child.totalPoints),
      success: async (res) => {
        if (res.confirm && res.content) {
          const newPoints = parseInt(res.content.trim())
          if (!isNaN(newPoints) && newPoints >= 0) {
            await updateChild({ ...child, totalPoints: newPoints })
            Taro.showToast({ title: '积分修改成功', icon: 'success' })
          } else {
            Taro.showToast({ title: '请输入有效积分（≥0）', icon: 'none' })
          }
        }
      }
    })
  }

  const handleDeleteChild = (child) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除 ${child.name} 吗？此操作不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          await deleteChild(child.id)
          if (selectedChildId === child.id) {
            setSelectedChildId(children[0]?.id || '')
          }
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }

  // 任务管理
  const handleAddCustomTask = async () => {
    const child = getOperatingChild()
    if (!child) return

    const name = customTaskName.trim()
    const points = parseInt(customTaskPoints)

    if (!name) {
      Taro.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }

    if (!points || points < 1 || points > 100) {
      Taro.showToast({ title: '积分范围1-100', icon: 'none' })
      return
    }

    // 让用户选择分类（使用孩子的分类，最多6个）
    const activeCategories = child.categories.filter(c => !c.isArchived)
    const displayCategories = activeCategories.slice(0, 6)

    if (displayCategories.length === 0) {
      Taro.showToast({ title: '请先添加分类', icon: 'none' })
      return
    }

    const categoryItems = displayCategories.map(c => `${c.icon} ${c.name}`)

    Taro.showActionSheet({
      itemList: categoryItems,
      fail: (err) => {
        console.log('用户取消选择')
      },
      success: async (res) => {
        if (res.tapIndex >= 0) {
          try {
            const category = displayCategories[res.tapIndex]

            const icons = ['📚', '✏️', '🎯', '⭐', '🏆', '💪', '🎨', '🎵', '📖', '🌟']
            const randomIcon = icons[Math.floor(Math.random() * icons.length)]

            const newTask = {
              id: Date.now().toString() + Math.random().toString().slice(2, 6),
              title: name,
              icon: randomIcon,
              points: points,
              completed: false,
              color: category.color,
              category
            }

            await addTask(newTask)
            setCustomTaskName('')
            setCustomTaskPoints('10')
            setShowCustomTask(false)
            Taro.showToast({ title: '添加成功', icon: 'success' })
          } catch (e) {
            console.error('添加任务失败', e)
            Taro.showToast({ title: '添加失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleDeleteTask = (taskId) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          await deleteTask(taskId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }

  // 奖励管理
  const handleAddCustomReward = async () => {
    const child = getOperatingChild()
    if (!child) return

    const name = customRewardName.trim()
    const cost = parseInt(customRewardCost)

    if (!name) {
      Taro.showToast({ title: '请输入奖励名称', icon: 'none' })
      return
    }

    if (!cost || cost < 1 || cost > 1000) {
      Taro.showToast({ title: '积分范围1-1000', icon: 'none' })
      return
    }

    const icons = ['🎁', '🎮', '📺', '🍦', '🍪', '🎠', '🎈', '⭐', '🏆', '💎']
    const randomIcon = icons[Math.floor(Math.random() * icons.length)]

    const colors = ['bg-pink-100 text-pink-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newReward = {
      id: Date.now().toString(),
      title: name,
      cost: cost,
      icon: randomIcon,
      color: randomColor
    }

    await addReward(newReward)
    setCustomRewardName('')
    setCustomRewardCost('50')
    setShowCustomReward(false)
    Taro.showToast({ title: '添加成功', icon: 'success' })
  }

  const handleDeleteReward = (rewardId) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个奖励吗？',
      success: async (res) => {
        if (res.confirm) {
          await deleteReward(rewardId)
          Taro.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  }

  // 分类管理
  const handleAddCustomCategory = async () => {
    const child = getOperatingChild()
    if (!child) return

    const name = customCategoryName.trim()

    if (!name) {
      Taro.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    // 检查是否已存在同名分类
    const exists = child.categories.some(c => c.name === name)
    if (exists) {
      Taro.showToast({ title: '分类名称已存在', icon: 'none' })
      return
    }

    // 让用户选择图标（最多6个）
    const iconGroups = [
      ['📚', '✏️', '🎯', '⭐', '🏆', '💪'],
      ['🎨', '🎵', '📖', '🌟', '🎮', '⚽'],
      ['🏃', '🧘', '🍳', '🧩', '🎸', '🎬']
    ]
    const randomGroup = iconGroups[Math.floor(Math.random() * iconGroups.length)]

    Taro.showActionSheet({
      itemList: randomGroup,
      fail: () => {},
      success: async (res) => {
        if (res.tapIndex >= 0) {
          try {
            // 让用户选择颜色
            const colors = [
              { name: '蓝色', value: 'bg-blue-100 text-blue-700' },
              { name: '绿色', value: 'bg-green-100 text-green-700' },
              { name: '紫色', value: 'bg-purple-100 text-purple-700' },
              { name: '黄色', value: 'bg-yellow-100 text-yellow-700' },
              { name: '粉色', value: 'bg-pink-100 text-pink-700' },
              { name: '红色', value: 'bg-red-100 text-red-700' }
            ]

            const colorItems = colors.map(c => c.name)
            const selectedIcon = randomGroup[res.tapIndex]

            Taro.showActionSheet({
              itemList: colorItems,
              fail: () => {},
              success: async (res2) => {
                if (res2.tapIndex >= 0) {
                  const newCategory = {
                    id: Date.now().toString() + Math.random().toString().slice(2, 6),
                    name: name,
                    icon: selectedIcon,
                    color: colors[res2.tapIndex].value,
                    isArchived: false,
                    isDefault: false,
                    createdAt: new Date().toISOString()
                  }

                  await addCategory(newCategory)
                  setCustomCategoryName('')
                  setShowCustomCategory(false)
                  Taro.showToast({ title: '添加成功', icon: 'success' })
                }
              }
            })
          } catch (e) {
            console.error('添加分类失败', e)
            Taro.showToast({ title: e.message || '添加失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleDeleteCategory = async (categoryId) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteCategory(categoryId)
            Taro.showToast({ title: '删除成功', icon: 'success' })
          } catch (e) {
            Taro.showToast({ title: e.message || '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleSyncToCloud = async () => {
    try {
      Taro.showLoading({ title: '同步中...', mask: true })
      const data = await getData()
      if (!data) throw new Error('无数据')
      await syncToCloud(data)
      Taro.hideLoading()
      Taro.showToast({ title: '同步成功', icon: 'success' })
    } catch (e) {
      Taro.hideLoading()
      Taro.showToast({ title: '同步失败，请检查网络', icon: 'none' })
    }
  }

  const handleRestoreFromCloud = () => {
    Taro.showModal({
      title: '从云端恢复',
      content: '将用云端数据覆盖本地数据，确定吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          Taro.showLoading({ title: '恢复中...', mask: true })
          const cloudData = await restoreFromCloud()
          Taro.hideLoading()
          if (!cloudData) {
            Taro.showToast({ title: '云端暂无数据', icon: 'none' })
            return
          }
          const success = await importData(JSON.stringify(cloudData))
          Taro.showToast({ title: success ? '恢复成功' : '数据格式错误', icon: success ? 'success' : 'none' })
        } catch (e) {
          Taro.hideLoading()
          Taro.showToast({ title: '恢复失败，请检查网络', icon: 'none' })
        }
      }
    })
  }

  if (!isAuthenticated) {
    return (
      <View className='parent-page'>
        <View className='auth-container'>
          <Text className='auth-title'>家长模式</Text>
          <Text className='auth-subtitle'>请输入密码进入</Text>

          <View className='password-input'>
            <Input
              type='password'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              placeholder='请输入4位密码'
              maxlength={4}
            />
          </View>

          <View className='auth-btn' onClick={verifyPassword}>
            <Text>确认</Text>
          </View>
        </View>
      </View>
    )
  }

  const operatingChild = currentTab !== 'members' ? children.find(c => c.id === selectedChildId) : null

  return (
    <View className='parent-page'>
      {/* Tab 导航 */}
      <View className='tab-bar'>
        <View className={`tab-item ${currentTab === 'members' ? 'active' : ''}`} onClick={() => setCurrentTab('members')}>
          <Text>成员</Text>
        </View>
        <View className={`tab-item ${currentTab === 'tasks' ? 'active' : ''}`} onClick={() => setCurrentTab('tasks')}>
          <Text>任务</Text>
        </View>
        <View className={`tab-item ${currentTab === 'rewards' ? 'active' : ''}`} onClick={() => setCurrentTab('rewards')}>
          <Text>奖励</Text>
        </View>
        <View className={`tab-item ${currentTab === 'categories' ? 'active' : ''}`} onClick={() => setCurrentTab('categories')}>
          <Text>分类</Text>
        </View>
        <View className={`tab-item ${currentTab === 'data' ? 'active' : ''}`} onClick={() => setCurrentTab('data')}>
          <Text>数据</Text>
        </View>
      </View>

      {/* 孩子选择器（任务、奖励和分类页面显示） */}
      {(currentTab === 'tasks' || currentTab === 'rewards' || currentTab === 'categories') && (
        <View className='child-selector'>
          <Text className='selector-label'>管理对象：</Text>
          <ScrollView scrollX className='selector-scroll'>
            <View className='selector-list'>
              {children.map(child => (
                <View
                  key={child.id}
                  className={`selector-item ${selectedChildId === child.id ? 'active' : ''}`}
                  onClick={() => handleChildSelect(child.id)}
                >
                  <Text className='selector-avatar'>{child.avatar}</Text>
                  <Text className='selector-name'>{child.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView scrollY className='content'>
        {currentTab === 'members' && (
          <View className='tab-content'>
            <Text className='section-title'>孩子管理 ({children.length})</Text>

            {children.map(child => (
              <View key={child.id} className='member-card'>
                <View className='member-info'>
                  <Text className='member-avatar'>{child.avatar}</Text>
                  <View className='member-details'>
                    <Text className='member-name'>{child.name}</Text>
                    <Text className='member-points'>💎 {child.totalPoints} 积分</Text>
                    <Text className='member-tasks'>✅ {child.tasks.filter(t => t.completed).length}/{child.tasks.length} 任务</Text>
                  </View>
                </View>
                <View className='member-actions'>
                  <Text className='action-btn' onClick={() => handleEditChild(child)}>编辑</Text>
                  <Text className='action-btn points' onClick={() => handleEditPoints(child)}>积分</Text>
                  <Text className='action-btn danger' onClick={() => handleDeleteChild(child)}>删除</Text>
                </View>
              </View>
            ))}

            <View className='add-btn' onClick={handleAddChild}>
              <Text>+ 添加孩子</Text>
            </View>
          </View>
        )}

        {currentTab === 'tasks' && (
          <View className='tab-content'>
            <Text className='section-title'>
              任务管理
              {operatingChild && ` - ${operatingChild.name} (${operatingChild.tasks.length})`}
            </Text>

            {!operatingChild && (
              <View className='empty-state'>
                <Text>请先选择一个孩子</Text>
              </View>
            )}

            {operatingChild && (
              <>
                <View className='quick-add-buttons'>
                  <View className='quick-btn' onClick={() => setShowCustomTask(!showCustomTask)}>
                    <Text>+ 添加任务</Text>
                  </View>
                </View>

                {showCustomTask && (
                  <View className='custom-input-card'>
                    <Text className='input-label'>任务名称</Text>
                    <Input
                      className='custom-input'
                      value={customTaskName}
                      onInput={(e) => setCustomTaskName(e.detail.value)}
                      placeholder='例如：练钢琴30分钟'
                    />
                    <Text className='input-label'>积分</Text>
                    <Input
                      className='custom-input'
                      type='number'
                      value={customTaskPoints}
                      onInput={(e) => setCustomTaskPoints(e.detail.value)}
                      placeholder='1-100'
                    />
                    <View className='confirm-btn' onClick={handleAddCustomTask}>
                      <Text>确认添加</Text>
                    </View>
                  </View>
                )}

                {operatingChild.tasks.map(task => (
                  <View key={task.id} className='item-card'>
                    <View className='item-info'>
                      <Text className='item-icon'>{task.icon}</Text>
                      <View className='item-details'>
                        <Text className='item-title'>{task.title}</Text>
                        <Text className='item-meta'>+{task.points} 积分 · {task.category?.name || '其他'}</Text>
                      </View>
                      {task.completed && <Text className='completed-badge'>已完成</Text>}
                    </View>
                    <Text className='delete-btn' onClick={() => handleDeleteTask(task.id)}>删除</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {currentTab === 'rewards' && (
          <View className='tab-content'>
            <Text className='section-title'>
              奖励管理
              {operatingChild && ` - ${operatingChild.name} (${operatingChild.rewards.length})`}
            </Text>

            {!operatingChild && (
              <View className='empty-state'>
                <Text>请先选择一个孩子</Text>
              </View>
            )}

            {operatingChild && (
              <>
                <View className='quick-add-buttons'>
                  <View className='quick-btn' onClick={() => setShowCustomReward(!showCustomReward)}>
                    <Text>+ 添加奖励</Text>
                  </View>
                </View>

                {showCustomReward && (
                  <View className='custom-input-card'>
                    <Text className='input-label'>奖励名称</Text>
                    <Input
                      className='custom-input'
                      value={customRewardName}
                      onInput={(e) => setCustomRewardName(e.detail.value)}
                      placeholder='例如：买乐高玩具'
                    />
                    <Text className='input-label'>所需积分</Text>
                    <Input
                      className='custom-input'
                      type='number'
                      value={customRewardCost}
                      onInput={(e) => setCustomRewardCost(e.detail.value)}
                      placeholder='1-1000'
                    />
                    <View className='confirm-btn' onClick={handleAddCustomReward}>
                      <Text>确认添加</Text>
                    </View>
                  </View>
                )}

                {operatingChild.rewards.map(reward => (
                  <View key={reward.id} className='item-card'>
                    <View className='item-info'>
                      <Text className='item-icon'>{reward.icon}</Text>
                      <View className='item-details'>
                        <Text className='item-title'>{reward.title}</Text>
                        <Text className='item-meta'>💎 {reward.cost} 积分</Text>
                      </View>
                    </View>
                    <Text className='delete-btn' onClick={() => handleDeleteReward(reward.id)}>删除</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {currentTab === 'categories' && (
          <View className='tab-content'>
            <Text className='section-title'>
              分类管理
              {operatingChild && ` - ${operatingChild.name} (${operatingChild.categories.filter(c => !c.isArchived).length})`}
            </Text>

            {!operatingChild && (
              <View className='empty-state'>
                <Text>请先选择一个孩子</Text>
              </View>
            )}

            {operatingChild && (
              <>
                <View className='quick-add-buttons'>
                  <View className='quick-btn' onClick={() => setShowCustomCategory(!showCustomCategory)}>
                    <Text>+ 添加分类</Text>
                  </View>
                </View>

                {showCustomCategory && (
                  <View className='custom-input-card'>
                    <Text className='input-label'>分类名称</Text>
                    <Input
                      className='custom-input'
                      value={customCategoryName}
                      onInput={(e) => setCustomCategoryName(e.detail.value)}
                      placeholder='例如：运动、艺术'
                    />
                    <View className='confirm-btn' onClick={handleAddCustomCategory}>
                      <Text>确认添加</Text>
                    </View>
                  </View>
                )}

                {operatingChild.categories.map(category => {
                  const taskCount = operatingChild.tasks.filter(t => t.category?.id === category.id).length
                  return (
                    <View key={category.id} className={`category-card ${category.isArchived ? 'archived' : ''}`}>
                      <View className='category-info'>
                        <Text className='category-icon'>{category.icon}</Text>
                        <View className='category-details'>
                          <Text className='category-name'>{category.name}</Text>
                          <Text className='category-meta'>
                            {taskCount} 个任务 · {category.isDefault ? '默认' : '自定义'}
                          </Text>
                        </View>
                        {category.isArchived && <Text className='archived-badge'>已归档</Text>}
                      </View>
                      {!category.isDefault && (
                        <View className='category-actions'>
                          <Text className='action-btn' onClick={() => handleDeleteCategory(category.id)}>删除</Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </>
            )}
          </View>
        )}

        {currentTab === 'data' && (
          <View className='tab-content'>
            <Text className='section-title'>数据管理</Text>

            <View className='data-card'>
              <Text className='data-title'>☁️ 同步到云端</Text>
              <Text className='data-desc'>将本地数据备份到微信云端</Text>
              <Text className='data-desc-small'>使用微信账号自动识别，无需注册登录</Text>
              <View className='data-btn cloud' onClick={handleSyncToCloud}>
                <Text>立即同步</Text>
              </View>
            </View>

            <View className='data-card'>
              <Text className='data-title'>☁️ 从云端恢复</Text>
              <Text className='data-desc'>将云端数据恢复到本机</Text>
              <Text className='data-desc-small'>更换设备后可用此功能迁移数据</Text>
              <View className='data-btn cloud-restore' onClick={handleRestoreFromCloud}>
                <Text>从云端恢复</Text>
              </View>
            </View>

            <View className='data-card'>
              <Text className='data-title'>当前孩子数量</Text>
              <Text className='data-value'>{children.length}</Text>
            </View>

            <View
              className='privacy-link'
              onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
            >
              <Text>隐私政策</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
