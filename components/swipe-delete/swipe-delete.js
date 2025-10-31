// components/swipe-delete/swipe-delete.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    // 组件索引，用于区分不同项
    index: {
      type: Number,
      value: 0
    },
    currentOpen: {
      type: Number,
      value: -1,
      observer: function(newVal) {
        // 监听全局状态变化，如果当前项不是展开项，则关闭
        if (newVal !== this.properties.index && this.data.isOpen) {
          this.resetPosition()
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    translateX: 0,           // 当前平移距离
    startX: 0,               // 触摸起始X坐标
    isSwiping: false,        // 是否正在滑动
    isOpen: false,           // 是否已展开删除按钮
    transition: 'none'       // 过渡动画
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleTouchStart(e) {
      this.setData({
        startX: e.touches[0].clientX,
        isSwiping: true,
        transition: 'none'
      });
    },
    handleTouchMove(e) {
      if (!this.data.isSwiping) return;
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - this.data.startX;
      // 限制滑动范围：0 到 -260rpx（删除按钮宽度）
      let newTranslateX = Math.max(Math.min(deltaX, 0), -260)
      this.setData({
        translateX: newTranslateX
      })
    },
    handleTouchEnd(e) {
      if (!this.data.isSwiping) return;
      this.setData({
        isSwiping: false,
        transition: 'transform 0.3s ease'
      })
      // 判断是否需要完全展开或回弹
      if (this.data.translateX < -130) { // 超过一半距离则完全展开
        this.setData({
          translateX: -260,
          isOpen: true
        })
        // 通知父组件当前展开项
        this.triggerEvent('open', {
          index: this.properties.index
        })
      } else { // 否则回弹到原位
        this.resetPosition()
      }
    },
    // 重置滑动位置到初始状态
    resetPosition() {
      this.setData({
        translateX: 0,
        isOpen: false
      })
    },
    handleDelete() {
      this.triggerEvent('delete', {
        index: this.properties.index
      });
      this.resetPosition();
    },
  },

  // 组件生命周期
  lifetimes: {
    detached() {
      // 组件被移除时重置状态
      this.resetPosition()
    }
  }
})