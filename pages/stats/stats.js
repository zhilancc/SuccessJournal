// pages/stats/stats.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "统计",
    journals: [],
    // 概览数据
    totalCount: 0,
    totalDays: 0,
    totalWords: 0,
    // 日历数据
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1, // 1-12
    calendarDays: [], // { day, type: 'prev'|'current'|'next', isSelected, hasLog, dateString }
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    selectedDate: '' // YYYY-MM-DD
  },

  onLoad(options) {
    // 默认选中今天
    const today = this.formatDate(new Date())
    this.setData({
      selectedDate: today,
    })
    this.initData()
  },

  onShow() {
    this.initData()
  },

  // 初始化数据
  initData() {
    const journals = wx.getStorageSync('allJournals') || []
    this.setData({ journals })
    this.computeOverview()
    this.generateCalendar()
  },

  // 计算概览数据
  computeOverview() {
    const journals = this.data.journals
    const totalCount = journals.length
    // 计算天数（去重）
    const uniqueDays = new Set(journals.map(j => j.date))
    const totalDays = uniqueDays.size
    // 计算字数
    const totalWords = journals.reduce((sum, j) => sum + (j.content ? j.content.length : 0), 0)
    
    this.setData({
      totalCount,
      totalDays,
      totalWords
    })
  },

  // 生成日历数据
  generateCalendar() {
    const year = this.data.currentYear
    const month = this.data.currentMonth
    const days = []

    // 获取当月第一天是星期几 (0-6, 0是周日)
    const firstDayObj = new Date(year, month - 1, 1)
    let firstDayWeek = firstDayObj.getDay()
    // 调整为周一为起始 (1-7, 7是周日)
    if (firstDayWeek === 0) firstDayWeek = 7

    // 获取当月总天数
    const daysInMonth = new Date(year, month, 0).getDate()

    // 获取上个月总天数
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

    // 补充上个月的日期 (灰色)
    for (let i = 1; i < firstDayWeek; i++) {
      days.push({
        day: daysInPrevMonth - (firstDayWeek - i) + 1,
        type: 'prev',
        dateString: '' // 简化逻辑，非本月不可点击
      })
    }

    // 补充当月日期
    const journals = this.data.journals
    // 创建快速查询集
    const journalDates = new Set(journals.map(j => j.date))

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const hasLog = journalDates.has(dateString)
      const isSelected = dateString === this.data.selectedDate

      days.push({
        day: i,
        type: 'current',
        hasLog,
        isSelected,
        dateString
      })
    }

    // 补充下个月的日期 (凑满6行=42个格子，或者5行=35个)
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        type: 'next',
        dateString: ''
      })
    }

    this.setData({ calendarDays: days })
  },

  // 切换月份
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth }, () => {
      this.generateCalendar()
    })
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth }, () => {
      this.generateCalendar()
    })
  },

  // 点击日期
  onDateTap(e) {
    console.log('点击日期：', e.currentTarget.dataset)
    const { date, type, hasLog } = e.currentTarget.dataset
    if (type !== 'current' || !date) return

    // 如果没有日志，不响应
    if (date !== this.formatDate(new Date()) && !hasLog) return

    // 更新选中状态
    this.setData({ selectedDate: date })
    this.generateCalendar() // 重新生成以更新样式

    console.log('跳转到指定日期：', date)
    // 跳转到首页
    wx.navigateTo({
      url: `/pages/index/index?date=${date}`
    })
  },

  // 触摸开始
  touchStart(e) {
    if (e.changedTouches.length === 1) {
      this.touchStartX = e.changedTouches[0].clientX
    }
  },

  // 触摸结束
  touchEnd(e) {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX
      const diff = touchEndX - this.touchStartX
      
      // 滑动距离超过 50px 才触发
      if (diff > 50) {
        this.prevMonth() // 向右滑，上一月
      } else if (diff < -50) {
        this.nextMonth() // 向左滑，下一月
      }
    }
  },

  // 工具：日期格式化 yyyy-mm-dd
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
