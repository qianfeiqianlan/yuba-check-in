// 插件安装时触发
chrome.runtime.onInstalled.addListener((details) => {
  console.log('插件已安装:', details)

  if (details.reason === 'install') {
    // 首次安装时打开欢迎页面
    chrome.tabs.create({ url: 'https://github.com/your/repo' })
  }
})

// 接收来自 popup 和 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background 收到消息:', request, sender)

  if (request.action === 'backgroundTest') {
    // 示例：处理后台逻辑
    sendResponse({ status: 'success', message: '后台已处理请求' })
  }

  return true // 保持消息通道开放
})

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('页面加载完成:', tab.url)
  }
})
