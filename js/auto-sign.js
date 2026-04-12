// 全局自动签到脚本，注入到所有douyu.com/*页面
(async () => {
  console.log('✅ inject auto sign js success, current page:', window.location.href)

  try {
    // 读取自动签到开关状态
    const result = await chrome.storage.local.get(['auto_sign_enabled', 'last_sign_date'])
    const autoSignEnabled = result.auto_sign_enabled || false
    const lastSignDate = result.last_sign_date || ''

    console.log('🔧 自动签到配置:', { autoSignEnabled, lastSignDate })

    // 如果开关未开启，直接返回
    if (!autoSignEnabled) {
      console.log('ℹ️ 自动签到开关未开启，跳过执行')
      return
    }

    // 获取今日日期，格式为YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    console.log('📅 今日日期:', today)

    // 如果今天已经签到过，直接返回
    if (lastSignDate === today) {
      console.log('✅ 今天已经完成签到了，无需重复执行', { today, lastSignDate })
      return
    }

    // 获取已保存的主播列表
    const groupsResult = await chrome.storage.local.get('saved_groups')
    const savedGroups = groupsResult.saved_groups || {}
    const groupList = Object.values(savedGroups)

    console.log('📋 已保存主播列表:', groupList)
    console.log('📊 主播数量:', groupList.length)

    // 如果没有保存的主播，直接返回
    if (groupList.length === 0) {
      console.log('ℹ️ 没有保存的主播，跳过自动签到')
      return
    }

    // 发送消息给background执行打开签到页面（content script无tabs权限）
    console.log('🚀 发送消息给后台，开始执行自动签到...')
    const response = await chrome.runtime.sendMessage({
      action: 'autoSign',
      groups: groupList
    })
    console.log('📩 后台返回结果:', response)

    // 保存今日签到时间
    await chrome.storage.local.set({ last_sign_date: today })
    console.log('💾 今日签到时间已保存:', today)
    console.log('🎉 自动签到全部执行完成！')
  } catch (error) {
    console.error('❌ 自动签到执行出错:', error)
  }
})()
