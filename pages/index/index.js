// index.js
Page({
  data: {
    autoIncrementID: 0,
    currentDate: '',
    journals: [],
    formatJournals: [],
    scrollIntoView: '',
    currentJournal: {
      id: '',
      content: '',
      date: '',
      created_at: '',
      updated_at: ''
    },
    isEdit: false,
    showModal: false,
    currentOpenIndex: -1, // 当前滑动展开项的索引
    focus: false,
  },
  onLoad(options) {
    // 初始化日期
    const today = this.formatDate(new Date());
    this.setData({
      currentDate: today
    });
    if (options && options.date) {
      this.jumpToDate = options.date
    }
    this.checkFirstVisit()
    this.loadJournals()
  },
  // 获取当前时间戳
  getTimestamp() {
    return Date.now();
  },
  // 日期格式化 yyyy-mm-dd
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  // 时间格式化 hh:mm
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  // 加载日志内容
  loadJournals() {
    const journals = wx.getStorageSync('allJournals') || [];
    const autoIncrementID = wx.getStorageSync('autoIncrementID') || 0;
    this.setData({
      journals,
      formatJournals: this.formatJournals(journals),
      autoIncrementID: autoIncrementID
    });
  },
  // 格式化日志内容(将日志按天进行分组)
  formatJournals(journals) {
    return journals.reduce((groups, journal) => {
      const date = journal.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(journal);
      return groups;
    }, {});
  },
  // 显示日志编辑弹窗
  showEditModal() {
    this.setData({
      focus: true,
      showModal: true,
      isEdit: false,
      currentOpenIndex: -1
    });
  },
  // 隐藏日志编辑弹窗
  hideEditModal() {
    if (this.data.isEdit) {
      this.setData({
        showModal: false,
        isEdit: false,
        currentJournal: {}
      });
    } else {
      this.setData({
        showModal: false
      });
    }
    console.log(this.data.currentJournal)
  },
  // 跳转统计页面
  goToStats() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    })
  },
  // 跳转到设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },
  // 保存记录
  onSaveJournal() {
    let journalContent = this.data.currentJournal.content
    if (journalContent === null || journalContent.trim() === "") {
      wx.showToast({
        title: '请输入内容...',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    let journals = [...this.data.journals];
    if (this.data.isEdit) {
      // 编辑现有记录
      const index = journals.findIndex(item => item.id === this.data.currentJournal.id);
      if (index !== -1) {
        this.data.currentJournal.updated_at = this.getTimestamp()
        journals[index] = this.data.currentJournal;
      }
    } else {
      // 添加新记录
      let id = ++this.data.autoIncrementID
      let currentJournal = {
        id: id,
        content: journalContent,
        date: this.data.currentDate,
        created_at: this.getTimestamp(),
        updated_at: this.getTimestamp()
      };
      journals.unshift(currentJournal);
      wx.setStorageSync('autoIncrementID', id);
    }
    // 保存到本地存储
    wx.setStorageSync('allJournals', journals);
    // 更新页面数据
    this.setData({
      journals,
      formatJournals: this.formatJournals(journals),
      showModal: false,
      currentJournal: {}
    });
    wx.showToast({
      title: this.data.isEdit ? '修改成功' : '记录成功',
      icon: 'success'
    });
  },
  // 编辑记录
  onEditJournal(e) {
    const id = e.currentTarget.dataset.id;
    const journal = this.data.journals.find(item => item.id === id);
    console.log(journal)
    if (journal) {
      this.setData({
        focus: true,
        showModal: true,
        isEdit: true,
        currentJournal: {...journal},
        currentOpenIndex: -1
      });
    }
  },
  // 删除记录
  onDeleteJournal(e) {
    const id = e.currentTarget.dataset.id;
    console.log(id)
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          let journals = this.data.journals.filter(item => item.id !== id);
          // 保存到本地存储
          wx.setStorageSync('allJournals', journals);
          // 更新页面数据
          this.setData({
            journals,
            formatJournals: this.formatJournals(journals),
            currentOpenIndex: -1
          });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  // 记录输入内容
  onJournalInput(e) {
    this.setData({
      'currentJournal.content': e.detail.value
    });
  },
  // 项目滑动展开时记录当前展开项索引
  onSwipeOpen(e) {
    const index = e.currentTarget.dataset.id;
    this.setData({
      currentOpenIndex: index
    })
  },
  // 容器点击事件（空白区域点击）
  onContainerTap(e) {
    let className = e.target.dataset.class || '';
    // 如果点击的不是列表项内容，则关闭所有展开项
    if (!className.includes('content-swipe') && !className.includes('content-item') && !className.includes('content-text') && this.data.currentOpenIndex !== -1) {
      this.setData({
        currentOpenIndex: -1
      })
    }
  },
  // 页面滚动监听（滚动阈值）
  onScroll(options) {
    let scrollTop = Math.abs(options.detail.scrollTop);
    if (this.data.currentOpenIndex !== -1 && (scrollTop > 60 || scrollTop < -60)) {
      this.setData({
        currentOpenIndex: -1
      });
    }
  },
  onShow() {
    this.loadJournals()
    if (this.jumpToDate) {
      const target = `day-${this.jumpToDate}`
      this.setData({ scrollIntoView: target })
      this.jumpToDate = ''
    }
  },
  checkFirstVisit() {
    let currentDate = this.data.currentDate
    let now = this.getTimestamp()
    let hasVisited = wx.getStorageSync('hasVisitedBefore');
    if (!hasVisited) {
      // 新用户首次访问时展示示例数据
      wx.setStorageSync('allJournals', [
        {
            "id": 1,
            "content": "🤝 遇见便是一种缘分。你好，欢迎使用《成功日记Pro》！👋✨",
            "date": currentDate,
            "created_at": now,
            "updated_at": now
        },
        {
          "id": 2,
          "content": "每一个小小的成就，都值得被记录！✍️✨",
          "date": currentDate,
          "created_at": now,
          "updated_at": now
      },
        {
            "id": 3,
            "content": "您的所有数据都安全地保存在本地设备，请放心使用。🔒",
            "date": currentDate,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": 4,
            "content": "👈向左滑动即可删除本条记录🗑️",
            "date": currentDate,
            "created_at": now,
            "updated_at": now
        },
        {
          "id": 5,
          "content": "👆点我一下，就可以编辑当前日记 ✏️",
          "date": currentDate,
          "created_at": now,
          "updated_at": now
        },
        {
          "id": 6,
          "content": "现在就写下你的第一个小成就吧，开启你的成长之旅！🚀",
          "date": currentDate,
          "created_at": now,
          "updated_at": now
        }
      ]);
      // 标记为已访问过，以后不再显示
      wx.setStorageSync('hasVisitedBefore', true);
      wx.setStorageSync('autoIncrementID', 6);
    }
  },
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '我正在使用《成功日记Pro》小程序来记录我的成长，超级好用！快来体验吧~', // 自定义标题
      imageUrl: '/images/qrcode.jpg' // 自定义图片（可选，不填则截屏）
    }
  },
  // 转发功能
  onShareAppMessage() {
    return {
      title: '推荐给你一个超棒的成功日记小程序。',
      path: '/pages/index/index', // 用户点击后进入的页面
      imageUrl: '/images/qrcode.jpg'
    }
  }
})
