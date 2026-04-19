console.log('✅ mygroups自动签到脚本已加载')

// 防抖处理
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 检查是否还有更多内容
function hasMoreContent() {
  const noMoreText = document.querySelector('.styles-module__eBtHEq__noMoreSplit')?.innerText
  return !noMoreText
}

// 滚动到页面底部
function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  })
}

// 收集页面所有鱼吧链接
function collectAllGroups() {
  const groupItems = Array.from(document.querySelectorAll('.index-module__Ud8XJa__main'))
  const groups = []
  const hrefSet = new Set() // 用于去重

  for (const item of groupItems) {
    const href = item.getAttribute('href')
    if (!href || !href.match(/^\/discussion\/\d+\/posts$/)) {
      continue
    }

    // 去重
    if (hrefSet.has(href)) {
      continue
    }
    hrefSet.add(href)

    groups.push({
      href,
      fullUrl: `https://yuba.douyu.com${href}`
    })
  }

  return groups
}

// 主逻辑
async function runAutoSign() {
  console.log('🚀 开始执行mygroups自动签到流程')

  while (hasMoreContent()) {
    scrollToBottom()
    await new Promise(resolve => setTimeout(resolve, 1500)) // 等待内容加载
  }


  // 收集所有鱼吧链接
  const groups = collectAllGroups()
  console.log(`📋 共收集到${groups.length}个鱼吧`)

  if (groups.length === 0) {
    console.log('ℹ️ 没有找到任何鱼吧，退出执行')
    window.close()
    return
  }

  // 发送消息给background执行打开签到页面
  try {
    console.log('🚀 发送消息给后台，开始执行自动签到...')
    const response = await chrome.runtime.sendMessage({
      action: 'autoSign',
      type: 'groups',
      groups: groups
    })
    console.log('📩 后台返回结果:', response)
  } catch (error) {
    console.error('❌ 发送消息失败:', error)
  }

  // 关闭当前页面
  console.log('✅ 签到任务已提交，关闭当前页面')
  window.close()
}

// 页面加载完成后执行
window.addEventListener('load', async () => {
  // 检查URL是否包含open_type=auto_check_in参数
  const urlParams = new URLSearchParams(window.location.search)
  const openType = urlParams.get('open_type')

  if (openType !== 'auto_check_in') {
    console.log('ℹ️ 不是自动签到模式，退出执行')
    return
  }

  // 延迟执行，确保页面基本内容加载完成
  setTimeout(async () => {
    await runAutoSign()
  }, 1000)
})
