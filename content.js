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
