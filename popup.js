// 获取已保存的小组列表
async function getSavedGroups() {
  const result = await chrome.storage.local.get('saved_groups')
  return result.saved_groups || {}
}

// 自定义确认弹窗
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal')
    const messageEl = document.getElementById('confirmMessage')
    const cancelBtn = document.getElementById('confirmCancel')
    const confirmBtn = document.getElementById('confirmConfirm')

    messageEl.textContent = message
    modal.style.display = 'flex'

    const handleCancel = () => {
      cleanup()
      resolve(false)
    }

    const handleConfirm = () => {
      cleanup()
      resolve(true)
    }

    const cleanup = () => {
      modal.style.display = 'none'
      cancelBtn.removeEventListener('click', handleCancel)
      confirmBtn.removeEventListener('click', handleConfirm)
    }

    cancelBtn.addEventListener('click', handleCancel)
    confirmBtn.addEventListener('click', handleConfirm)
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  const testBtn = document.getElementById('testBtn')
  const openSignPagesBtn = document.getElementById('openSignPagesBtn')
  const savedGroupsList = document.getElementById('savedGroupsList')
  const autoSignToggle = document.getElementById('autoSignToggle')

  // 加载自动签到开关状态
  async function loadAutoSignStatus() {
    const result = await chrome.storage.local.get('auto_sign_enabled')
    autoSignToggle.checked = result.auto_sign_enabled || false
  }

  // 保存自动签到开关状态
  autoSignToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ auto_sign_enabled: autoSignToggle.checked })
  })

  // 加载已保存的小组列表
  async function loadSavedGroups() {
    const savedGroups = await getSavedGroups()
    const groupList = Object.values(savedGroups)

    if (groupList.length === 0) {
      savedGroupsList.innerHTML = `
        <div class="empty-tip" style="text-align: center; padding: 20px 0; color: #999; font-size: 14px;">
          暂无添加的主播
        </div>
      `
      return
    }

    // 按保存时间倒序排列
    groupList.sort((a, b) => b.saveTime - a.saveTime)

    savedGroupsList.innerHTML = ''
    groupList.forEach(group => {
      const item = document.createElement('div')
      item.className = 'group-item'
      item.innerHTML = `
        <img class="group-avatar" src="${group.src}" alt="${group.title}">
        <div class="group-name">${group.title}</div>
        <div class="group-actions">
          <button class="action-btn top-btn" title="置顶">⬆️</button>
          <button class="action-btn delete-btn" title="删除">❌</button>
        </div>
      `

      // 点击小组名称打开链接
      item.querySelector('.group-avatar').addEventListener('click', (e) => {
        e.stopPropagation()
        chrome.tabs.create({ url: `https://yuba.douyu.com${group.href}` })
        window.close()
      })
      item.querySelector('.group-name').addEventListener('click', (e) => {
        e.stopPropagation()
        chrome.tabs.create({ url: `https://yuba.douyu.com${group.href}` })
        window.close()
      })

      // 置顶按钮
      item.querySelector('.top-btn').addEventListener('click', async (e) => {
        e.stopPropagation()
        const savedGroups = await getSavedGroups()
        // 更新保存时间为当前最新时间，这样排序就会到最前面
        savedGroups[group.href].saveTime = Date.now()
        await chrome.storage.local.set({ saved_groups: savedGroups })
        // 重新加载列表
        await loadSavedGroups()
      })

      // 删除按钮
      item.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation()
        if (await showConfirm(`确定要删除「${group.title}」吗？`)) {
          const savedGroups = await getSavedGroups()
          delete savedGroups[group.href]
          await chrome.storage.local.set({ saved_groups: savedGroups })
          // 重新加载列表
          await loadSavedGroups()
        }
      })

      savedGroupsList.appendChild(item)
    })
  }

  // 页面加载时读取已保存的小组和自动签到状态
  await loadSavedGroups()
  await loadAutoSignStatus()

  // 打开我关注的鱼吧
  document.getElementById('myGroupsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://yuba.douyu.com/mygroups' })
    window.close()
  })

  // 打开全部鱼吧
  document.getElementById('allGroupsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://yuba.douyu.com/groupcates/discovery/rec' })
    window.close()
  })

  // 打开所有签到页面
  openSignPagesBtn.addEventListener('click', async () => {
    const savedGroups = await getSavedGroups()
    const groupList = Object.values(savedGroups)

    if (groupList.length === 0) {
      alert('你还没有保存任何小组哦~')
      return
    }

    // 按当前列表顺序打开所有小组签到页面
    groupList.forEach(group => {
      const signUrl = `https://yuba.douyu.com${group.href}?open_type=auto_check_in`
      chrome.tabs.create({ url: signUrl, active: false }) // active: false 表示在后台打开，不切换标签
    })

    // 关闭popup
    window.close()
  })

  // 关闭所有签到标签页
  document.getElementById('closeAllSignTabsBtn').addEventListener('click', async () => {
    // 查询所有标签页
    const tabs = await chrome.tabs.query({})
    // 筛选出URL包含open_type=auto_check_in的标签页
    const signTabs = tabs.filter(tab => tab.url && tab.url.includes('open_type=auto_check_in'))

    if (signTabs.length === 0) {
      // alert('未找到需要关闭的签到标签页~')
      return
    }

    // 关闭所有匹配的标签页
    signTabs.forEach(tab => {
      chrome.tabs.remove(tab.id)
    })

    // 关闭popup
    window.close()
  })
})
