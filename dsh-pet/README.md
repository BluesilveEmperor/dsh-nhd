# dsh-pet-nhd 🌿 纳西妲

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-pet-nhd"><img alt="npm version" src="https://img.shields.io/npm/v/dsh-pet-nhd?label=npm&color=blue"></a>
  <a href="https://www.npmjs.com/package/dsh-pet-nhd"><img alt="npm downloads" src="https://img.shields.io/npm/dm/dsh-pet-nhd?label=%E6%9C%88%E4%B8%8B%E8%BD%BD&color=brightgreen"></a>
  <a href="https://github.com/BluesilveEmperor/dsh-nhd"><img alt="github" src="https://img.shields.io/badge/GitHub-BluesilveEmperor%2Fdsh--nhd-181717?logo=github"></a>
  <img alt="platform" src="https://img.shields.io/badge/platform-DeepSeek%20Harness-8A2BE2">
  <img alt="assets" src="https://img.shields.io/badge/animations-106%20VP9--alpha-ff69b4">
</p>

**草神纳西妲住进了 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)**：平时安静地在桌面上打坐、溜达、吃点小零食，被你拖来甩去也乖乖配合；你忙起来她帮你盯着余额钱包、念叨碎碎念，闲下来乐意听你唠两句，偶尔施展点小小的智慧魔法。

- **106 个透明动画**（640×360 VP9-alpha，程序化生成）：待机呼吸、东张西望、屏幕漫游、点击 Q 弹、拖拽甩抛、吃饭/时节/玩耍全套动作
- **桌面形态**：透明置顶小窗（Electron 自动下载），浏览器 overlay 同行为
- **余额档位动画**：满格到告急到耗尽，六档随余额变化
- **碎碎念 + 对话**：跟随 DSH 会话事件的六档工作状态动画
- **可多开**、可自定义 pet pack，与原版鲸鱼娘插件**可同时安装**（独立命名空间：命令、路由、存储互不干扰）

## 安装

**桌面应用（Electron 版）**：应用内「插件管理」页安装框填 `dsh-pet-nhd`。

**`dsh web`**：

```sh
dsh plugin --profile web add dsh-pet-nhd
```

装完重开桌面应用（`dsh web` 用户则重启 `dsh web`）即生效。插件自带纳西妲全套素材与配置，开箱即用。

## 斜杠命令

| 命令           | 作用                              |
| -------------- | --------------------------------- |
| `/pet-nhd`     | 多只纳西妲时选择对话目标          |
| `/chat-nhd`    | 与纳西妲对话（留空 = 碎碎念一句） |
| `/balance-nhd` | 手动触发余额显示                  |

## 上游与致谢

本包是 [dsh-pet](https://www.npmjs.com/package/dsh-pet)（原版**蓝色大肥鱼鲸鱼娘**桌宠）的纳西妲形象 fork：

- **原作者 / 上游仓库**：<https://github.com/PC2005-cloud/dsh-pet> —— 原版插件、pet pack 机制、桌宠引擎与构建链均出自该仓库，请给原作者点个 ⭐
- **本 fork 仓库**：<https://github.com/BluesilveEmperor/dsh-nhd>（形象重制为纳西妲 + 多实例共存改造）
- 遵循上游 LICENSE 分发；插件架构与功能文档见上游仓库 README

## 完整文档

安装细节、效果预览（106 动画全览）、pet pack 自定义、从零生成你自己的宠物等完整文档见 fork 仓库 <https://github.com/BluesilveEmperor/dsh-nhd#readme>。
