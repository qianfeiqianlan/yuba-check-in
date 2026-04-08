// 接收来自 popup 和 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script 收到消息:', request)

  if (request.action === 'test') {
    // 示例：在页面上显示提示
    const div = document.createElement('div')
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px;
      background: #409eff;
      color: white;
      border-radius: 4px;
      z-index: 999999;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    `
    div.textContent = `插件消息: ${request.data}`
    document.body.appendChild(div)

    setTimeout(() => {
      div.remove()
    }, 3000)

    sendResponse({ message: 'Content script 已收到消息' })
  }

  return true // 保持消息通道开放，用于异步响应
})

// 页面加载完成后执行
console.log('Chrome 插件 content script 已加载')

// 检查URL参数是否需要自动关闭页面
const urlParams = new URLSearchParams(window.location.search)


// 等待页面元素加载完成
window.addEventListener('load', () => {
  // 延迟1秒执行，确保动态元素加载完成
  setTimeout(() => {
    const isPluginOpen = urlParams.get('open_type') === 'auto_check_in'
    if(!isPluginOpen) {
      console.log('ℹ️ 无需操作，不是插件打开')
      return
    }
    // 查找所有div，过滤出内容为"签到"的按钮
    const allDivs = Array.from(document.querySelectorAll('div'))
    const signBtn = allDivs.find(div =>
      div.textContent.trim() === '签到'
    )

    if (signBtn) {
      signBtn.click()
      console.log('✅ 签到成功')
    } else {
      console.log('ℹ️ 无需签到，未找到签到按钮')
    }
    window.close()
  }, 1000)
})
