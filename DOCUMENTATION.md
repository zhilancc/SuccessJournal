# 成功日记 Pro — 项目技术文档

本文档基于当前仓库源码整理，描述小程序的结构、数据流与主要模块职责。

## 1. 项目概述

**成功日记 Pro** 是一款微信小程序，用于记录每日「小成就」类日记。数据全部保存在用户设备本地（`wx.setStorageSync`），不依赖服务端账号体系，适合离线、隐私优先的使用场景。

## 2. 技术栈与运行环境

| 项 | 说明 |
| --- | --- |
| 平台 | 微信小程序 |
| 渲染 | Skyline（`app.json` 中 `renderer: "skyline"`） |
| 组件框架 | glass-easel（`componentFramework`） |
| 基础库 | `project.config.json` 中 `libVersion` 为 `3.10.0`（以本地配置为准） |
| 样式 | 小程序 WXSS，部分页面使用自定义导航栏 |
| 代码加载 | `lazyCodeLoading: "requiredComponents"`，按需注入组件 |

使用 **微信开发者工具** 打开项目根目录即可预览与调试；上传与发布需配置合法的小程序 AppID（见 `project.config.json`）。

## 3. 目录结构

```
SuccessJournal/
├── app.js                 # 全局 App，当前为空实现
├── app.json               # 全局配置：页面路由、窗口、Skyline 等
├── app.wxss               # 全局样式（容器等基础类）
├── project.config.json    # 开发者工具工程配置、AppID、编译选项
├── sitemap.json           # 小程序索引规则（当前为允许全部页面）
├── pages/
│   ├── index/             # 主页：日记列表与编辑
│   ├── user/              # 占位页面（仅模板文案）
│   ├── settings/          # 设置：导出/导入、关于
│   └── stats/             # 统计：概览 + 日历
└── components/
    ├── navigation-bar/      # 自定义导航栏（适配安全区、返回等）
    ├── swipe-delete/        # 左滑露出删除的列表项容器
    └── custom-modal/        # 编辑/新建日记的弹层
```

## 4. 页面说明

### 4.1 首页 `pages/index/index`

- **职责**：按日期分组展示所有日记；新增、编辑、删除单条记录。
- **入口参数**：支持 `?date=YYYY-MM-DD`，进入后通过 `scroll-into-view` 滚动到对应日期锚点（`id="day-日期"`）。
- **交互要点**：
  - 底部「记录成就」打开 `custom-modal`，内嵌 `textarea` 与横向滚动的**写作模板** chips。
  - 点击条目进入编辑；列表项外包 `swipe-delete`，左滑删除。
  - 点击空白或滚动超过阈值时收起已展开的滑动项（`currentOpenIndex` 协调多行仅一行展开）。
- **分享**：实现 `onShareAppMessage`、`onShareTimeline`，带标题与分享图。

### 4.2 统计页 `pages/stats/stats`

- **职责**：读取本地全部日记，展示总条数、有记录的天数（按 `date` 去重）、总字数；月历标出有日志的日期。
- **日历**：周一为一周起始；可切换上/下月；支持左右滑动手势切换月份。
- **跳转**：点击**当月**某一天时，若该日有记录或为**今天**，则 `navigateTo` 首页并带上 `date` 参数，便于回看该日内容。

### 4.3 设置页 `pages/settings/settings`

- **导出**：将 `allJournals` 与元数据（版本、导出时间）序列化为 JSON，写入用户目录临时文件，再通过 `wx.shareFileMessage` 分享；失败时尝试 `wx.openDocument` 降级。
- **导入**：`wx.chooseMessageFile` 选择 JSON，校验 `data` 为数组后提示**覆盖**现有本地数据（非合并）。
- **关于**：弹层展示信息；可复制公众号名称「自在牛马」到剪贴板。
- **版本号**：优先 `wx.getAccountInfoSync().miniProgram.version`，否则环境版本或默认 `1.0.0`。

### 4.4 用户页 `pages/user/index`

- **现状**：占位页面（WXML 仅一行说明文本），逻辑文件为模板生命周期空实现，**未接入业务**。

## 5. 自定义组件

### `navigation-bar`

- 自定义顶栏，适配胶囊按钮与安全区；支持 `title`、`back`、`delta` 等属性，返回时 `wx.navigateBack`。

### `swipe-delete`

- **属性**：`index`（与父层约定的项标识，首页传入日记 `id`）、`currentOpen`（当前全局展开项索引）。
- **行为**：触摸横向位移，超过阈值展开删除区并 `triggerEvent('open')`；删除时 `triggerEvent('delete')`；当 `currentOpen` 变化且非本项时自动收起。

### `custom-modal`

- **属性**：`show`、`title`、`expanded`（与焦点/展开态相关）。
- **事件**：`confirm`、`cancel`；支持默认 slot 插入表单内容。

## 6. 本地存储设计

| Key | 类型 | 用途 |
| --- | --- | --- |
| `allJournals` | `Array` | 全部日记条目，持久化主数据 |
| `autoIncrementID` | `Number` | 自增主键，新建条目时递增并写回 |
| `hasVisitedBefore` | `Boolean` | 是否已完成首次访问引导；未访问时写入示例数据 |

**注意**：导入功能会整体替换 `allJournals`，使用前需确认备份。

## 7. 数据模型（单条日记）

单条对象字段与代码一致，示例如下：

```json
{
  "id": 1,
  "content": "日记正文",
  "date": "2026-04-08",
  "created_at": 1712534400000,
  "updated_at": 1712534400000
}
```

- `date`：字符串，`YYYY-MM-DD`，用于分组与日历。
- `created_at` / `updated_at`：毫秒时间戳（`Date.now()`）。

**导出文件**外层结构（`settings.js` 导出逻辑）：

```json
{
  "version": "1.0.0",
  "exportTime": 1712534400000,
  "data": [ /* 与 allJournals 相同结构的数组 */ ]
}
```

## 8. 首次访问逻辑

`pages/index/index.js` 中 `checkFirstVisit()`：若不存在 `hasVisitedBefore`，则向 `allJournals` 写入多条欢迎与操作提示示例，并设置 `autoIncrementID` 为 `6`，再标记已访问。之后不再自动注入示例。

## 9. 全局配置摘要（`app.json`）

- **页面顺序**：`index` → `user` → `settings` → `stats`（首页为默认启动页）。
- **窗口**：`navigationStyle: custom`，由页面内 `navigation-bar` 承担顶栏。
- **Skyline**：开启 `defaultDisplayBlock`、`defaultContentBox` 等选项，具体以官方文档与真机表现为准。

## 10. 开发与维护建议

1. **用户页**：若产品需要「我的」功能，可在 `pages/user` 补全 UI 与路由，并在 `app.json` 中按需调整 tab 或入口。
2. **数据安全**：本地存储无加密；敏感场景可考虑自行加密后再写入 Storage（需评估性能与密钥方案）。
3. **导入合并**：当前导入为覆盖模式；若需合并去重，需在 `onImport` 中增加合并策略与冲突处理。
4. **Skyline 兼容性**：列表与动画建议在真机与开发者工具 Skyline 模式下分别验证。

---

*文档版本与仓库源码同步维护；若修改存储结构或页面路由，请同步更新本文档。*
