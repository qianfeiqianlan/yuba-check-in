console.log('✅ 我的小组页面脚本已加载')

// 存储键名
const STORAGE_KEY = 'saved_groups'

// 监听单页应用的pushState和replaceState路由跳转
const originalPushState = history.pushState
history.pushState = function(...args) {
  originalPushState.apply(this, args)
  window.dispatchEvent(new Event('pushstate'))
}

const originalReplaceState = history.replaceState
history.replaceState = function(...args) {
  originalReplaceState.apply(this, args)
  window.dispatchEvent(new Event('replacestate'))
}

// 检查插件上下文是否有效
function isExtensionContextValid() {
  try {
    return !!chrome && !!chrome.storage && !!chrome.runtime.id
  } catch (e) {
    return false
  }
}

// 获取已保存的小组列表
async function getSavedGroups() {
  if (!isExtensionContextValid()) {
    console.log('⚠️ 插件上下文已失效，请刷新页面')
    return {}
  }
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] || {}
  } catch (e) {
    console.log('⚠️ 存储访问失败:', e.message)
    return {}
  }
}

// 保存小组
async function saveGroup(href, data) {
  if (!isExtensionContextValid()) {
    alert('插件已更新，请刷新页面后重试')
    return
  }
  try {
    const savedGroups = await getSavedGroups()
    savedGroups[href] = data
    await chrome.storage.local.set({ [STORAGE_KEY]: savedGroups })
  } catch (e) {
    console.log('⚠️ 保存失败:', e.message)
    alert('保存失败，请刷新页面后重试')
  }
}

// 移除小组
async function removeGroup(href) {
  if (!isExtensionContextValid()) {
    alert('插件已更新，请刷新页面后重试')
    return
  }
  try {
    const savedGroups = await getSavedGroups()
    delete savedGroups[href]
    await chrome.storage.local.set({ [STORAGE_KEY]: savedGroups })
  } catch (e) {
    console.log('⚠️ 移除失败:', e.message)
    alert('移除失败，请刷新页面后重试')
  }
}

// 判断小组是否已保存
async function isGroupSaved(href) {
  if (!isExtensionContextValid()) {
    return false
  }
  try {
    const savedGroups = await getSavedGroups()
    return !!savedGroups[href]
  } catch (e) {
    return false
  }
}

// 创建按钮元素
function createButton(isSaved, href, groupData) {
  const btn = document.createElement('button')
  btn.textContent = isSaved ? '移出' : '添加'
  btn.style.cssText = `
    padding: 4px 12px;
    margin-left: 8px;
    background: ${isSaved ? '#f56c6c' : '#67c23a'};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1.5;
  `

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSaved) {
      await removeGroup(href)
      btn.textContent = '保存'
      btn.style.background = '#67c23a'
      console.log('✅ 小组已移出', groupData.title)
    } else {
      await saveGroup(href, groupData)
      btn.textContent = '移出'
      btn.style.background = '#f56c6c'
      console.log('✅ 小组已保存', groupData.title)
    }

    // 更新按钮状态
    isSaved = !isSaved
  })

  return btn
}

// 处理单个小组卡片
async function processGroupCard(aTag) {
  const href = aTag.getAttribute('href')
  if (!href || !href.match(/^\/discussion\/\d+\/posts$/)) {
    return
  }

  // 提取数据
  const img = aTag.querySelector('img')
  const titleDiv = aTag.querySelector('div.index-module__Ud8XJa__name')

  if (!img || !titleDiv) {
    return
  }

  const src = img.getAttribute('src')
  const title = titleDiv.getAttribute('title') || titleDiv.textContent.trim()

  const groupData = {
    href,
    src,
    title,
    fullUrl: `https://yuba.douyu.com${href}`,
    saveTime: Date.now()
  }

  // 检查是否已经添加过按钮
  if (titleDiv.parentNode.querySelector('.extension-save-btn')) {
    return
  }

  // 创建按钮
  const isSaved = await isGroupSaved(href)
  const btn = createButton(isSaved, href, groupData)
  btn.classList.add('extension-save-btn')

  // 添加到title所在div后面
  titleDiv.parentNode.appendChild(btn)
}

// 处理所有小组卡片
async function processAllGroups() {
  const aTags = Array.from(document.querySelectorAll('a[href^="/discussion/"]'))
  for (const aTag of aTags) {
    await processGroupCard(aTag)
  }
}

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

// 监听DOM变化，自动重新处理小组卡片
const observer = new MutationObserver(debounce(async () => {
  await processAllGroups()
}, 100))

// 页面加载完成后执行
window.addEventListener('load', async () => {
  // 检查是否开启了直接签到关注列表模式，如果开启则不添加按钮
  try {
    const result = await chrome.storage.local.get('auto_sign_mygroups_enabled')
    if (result.auto_sign_mygroups_enabled) {
      console.log('ℹ️ 已开启直接签到关注列表模式，不添加操作按钮')
      return
    }
  } catch (e) {
    console.log('⚠️ 检查开关状态失败:', e.message)
  }

  // 延迟执行，确保动态内容加载完成
  setTimeout(async () => {
    await processAllGroups()
    console.log('✅ 所有小组卡片处理完成')

    // 开始监听整个页面的DOM变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }, 300)

  // 监听路由变化（单页应用所有跳转场景）
  const handleRouteChange = debounce(async () => {
    console.log('🔄 检测到路由变化，重新处理小组卡片')
    setTimeout(async () => {
      await processAllGroups()
    }, 300)
  }, 100)

  window.addEventListener('popstate', handleRouteChange)
  window.addEventListener('pushstate', handleRouteChange)
  window.addEventListener('replacestate', handleRouteChange)

  // 监听滚动加载，处理新加载的内容
  window.addEventListener('scroll', debounce(async () => {
    await processAllGroups()
  }, 100))
})

// 页面卸载时停止监听
window.addEventListener('beforeunload', () => {
  observer.disconnect()
})
