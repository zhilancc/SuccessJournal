// pages/settings/settings.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "设置",
    version: "1.0.0",
    showAbout: false
  },

  /**
   * 导出数据
   */
  onExport() {
    wx.showLoading({ title: '准备导出...' })
    try {
      // 1. 获取日志数据
      const journals = wx.getStorageSync('allJournals') || []
      const exportData = {
        version: this.data.version,
        exportTime: new Date().getTime(),
        data: journals
      }
      const jsonStr = JSON.stringify(exportData, null, 2)
      // 2. 写入临时文件
      const fs = wx.getFileSystemManager()
      const fileName = `success_journal_backup_${this.formatDate(new Date())}.json`
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
      fs.writeFile({
        filePath,
        data: jsonStr,
        encoding: 'utf8',
        success: () => {
          wx.hideLoading()
          // 3. 弹出模态框让用户确认分享到微信聊天或文件传输助手
          // 原因：shareFileMessage 必须由用户点击事件直接触发，不能在异步回调中自动触发
          wx.showModal({
            title: '导出成功',
            content: '文件已生成，是否立即发送给好友或保存到文件传输助手？',
            confirmText: '发送',
            success: (res) => {
              if (res.confirm) {
                this.shareFile(filePath, fileName)
              }
            }
          })
        },
        fail: (err) => {
          wx.hideLoading()
          wx.showToast({ title: '生成文件失败', icon: 'none' })
          console.error(err)
        }
      })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '导出日志出错', icon: 'none' })
      console.error(e)
    }
  },

  // 分享导出的日志文件到微信聊天或文件传输助手
  shareFile(filePath, fileName) {
    wx.shareFileMessage({
      filePath: filePath,
      fileName: fileName,
      success: () => {
        console.log('分享成功')
      },
      fail: (err) => {
        console.error('分享失败', err)
        // 降级方案：尝试打开文件让用户另存
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            fileType: 'json'
          })
        }
      }
    })
  },

  /**
   * 导入数据
   */
  onImport() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const filePath = res.tempFiles[0].path
        console.log(filePath)
        const fs = wx.getFileSystemManager()
        wx.showLoading({ title: '正在导入...' })
        fs.readFile({
          filePath,
          encoding: 'utf8',
          success: (data) => {
            try {
              const content = JSON.parse(data.data)
              // 简单校验格式
              if (!content.data || !Array.isArray(content.data)) {
                throw new Error('文件格式不正确')
              }
              // 询问是否覆盖或合并
              wx.showModal({
                title: '导入确认',
                content: `读取到 ${content.data.length} 条记录，确定要导入吗？这将覆盖现有数据。`,
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.setStorageSync('allJournals', content.data)
                    wx.showToast({ title: '导入成功', icon: 'success' })
                  }
                }
              })
            } catch (e) {
              wx.showToast({ title: '文件解析失败', icon: 'none' })
            } finally {
              wx.hideLoading()
            }
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '读取文件失败', icon: 'none' })
          }
        })
      }
    })
  },

  /**
   * 关于我
   */
  onAbout() {
    this.setData({ showAbout: true })
  },

  /**
   * 关闭关于弹窗
   */
  closeAbout() {
    this.setData({ showAbout: false })
  },

  /**
   * 阻止冒泡
   */
  stopProp() {},

  /**
   * 复制公号
   */
  copyOfficialAccount() {
    wx.setClipboardData({
      data: '自在牛马',
      success: () => {
        wx.showToast({
          title: '公号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 工具：日期格式化 yyyyMMdd
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initVersion()
  },

  /**
   * 初始化版本信息
   */
  initVersion() {
    try {
      const accountInfo = wx.getAccountInfoSync()
      const { miniProgram } = accountInfo
      // 优先显示线上版本号，如果是开发版则显示环境版本
      const version = miniProgram.version || miniProgram.envVersion || '1.0.0'
      this.setData({ version })
    } catch (e) {
      console.error('获取版本信息失败', e)
      this.setData({ version: '1.0.0' })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})