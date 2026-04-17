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
  // 检测页面中是否存在"没有更多内容了"的文本
  const noMoreText = document.body.innerText.includes('没有更多内容了')
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
  const aTags = Array.from(document.querySelectorAll('a[href^="/discussion/"]'))
  const groups = []
  const hrefSet = new Set() // 用于去重

  for (const aTag of aTags) {
    const href = aTag.getAttribute('href')
    if (!href || !href.match(/^\/discussion\/\d+\/posts$/)) {
      continue
    }

    // 去重
    if (hrefSet.has(href)) {
      continue
    }
    hrefSet.add(href)

    // 提取数据，参考mygroups.js的逻辑
    const img = aTag.querySelector('img')
    const titleDiv = aTag.querySelector('div.index-module__Ud8XJa__name')

    if (!img || !titleDiv) {
      continue
    }

    const src = img.getAttribute('src')
    const title = titleDiv.getAttribute('title') || titleDiv.textContent.trim()

    groups.push({
      href,
      src,
      title,
      fullUrl: `https://yuba.douyu.com${href}`,
      saveTime: Date.now()
    })
  }

  return groups
}

// 主逻辑
async function runAutoSign() {
  console.log('🚀 开始执行mygroups自动签到流程')

  // 滚动加载所有内容
  let scrollCount = 0
  const maxScrollCount = 50 // 防止无限滚动

  while (hasMoreContent() && scrollCount < maxScrollCount) {
    scrollToBottom()
    console.log(`📜 正在加载更多内容，第${scrollCount + 1}次滚动`)
    await new Promise(resolve => setTimeout(resolve, 1500)) // 等待内容加载
    scrollCount++
  }

  if (scrollCount >= maxScrollCount) {
    console.log('⚠️ 达到最大滚动次数，停止加载')
  } else {
    console.log('✅ 所有内容已加载完成')
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
