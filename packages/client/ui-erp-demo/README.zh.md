---
description: "在 DSH Web 中浏览本地跨境电商 ERP 演示面板。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-erp-demo

[English](README.md) | 中文

## 概述

DSH 侧栏的「跨境ERP」入口打开浏览器内的 ERP 演示面板，包含销售、产品、仓库、采购、库存、WMS、基础管理和系统设置。各模块展示少量字段和示例记录；系统设置提供最多三级的菜单编辑。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用本包

从此源码仓库启动 Web profile。登录页独立占满整个网页，登录成功后显示侧栏和工作台；刷新页面时，已保存的登录状态会恢复刷新前选中的 ERP 页面或对话页。点击「退出登录」会返回整页登录界面，账号或密码错误时不会进入主界面。演示账号为 `admin`，密码为 `123456`；这是仅在浏览器执行的界面门禁，不是服务端身份认证，当前没有过期时间。登录后，侧栏品牌显示蓝紫色跨境ERP标识，顶部独立的「新会话」按钮隐藏，原有「工作区」保持原样；其上方新增可滚动的 ERP 一级至三级菜单，工作台使用仪表盘图标，菜单下方以「数据与工具」分隔数据库、Skills 和插件。右下角按钮在 ERP 页面上打开可关闭的浮动对话窗，窗内复用 DSH 原生会话内容；ERP 页面保持原位。

构建本地 ERP 网页时设置 `DSH_CLIENT_TITLE=跨境ERP`，Web 构建会选择同款蓝紫色 favicon、ERP PWA 清单和浏览器标题；未设置该标题的 DSH 构建继续使用原有品牌资源。

在「菜单配置」中新增、编辑、隐藏、排序或删除菜单，左侧导航会即时更新。菜单以 `dsh-erp-demo.menus.v1` 为键保存在当前浏览器的 `localStorage` 中，当前 ERP 页面另以 `dsh-erp-demo.page.v1` 保存，主视图选择以 `dsh-erp-demo.main-view.v1` 保存；「恢复默认菜单」可重新加载预置菜单。路径字段保留给后续路由接入；当前预览只切换面板内页面，不改变浏览器地址。业务示例记录固定在 `src/client/model.ts` 中。

工作台的「我的待办」只在当前页面保存开始和完结状态。开始任务需要二次确认；完结任务显示该类型的处理结果选项，确认后移出列表并更新数量。刷新页面会恢复全部演示待办。

点击「未读通知」卡片可查看按通知类型展示的演示详情；打开或关闭详情不会改变工作台计数。

<a id="understand-the-implementation"></a>
## 理解实现

插件注册一个 `main` 面板、一个 `sidebar.erp-navigation` 侧栏区域和一个 `shell.overlay` 全屏登录门禁。页面和侧栏共享 ERP 菜单状态；`model.ts` 维护默认菜单、示例记录和本地菜单存储；`demoState.ts` 维护本地演示登录并将状态共享给登录页和退出按钮。此阶段没有新增 Host API、Session 事件、数据库、角色校验或 Agent 操作；浮动窗使用 DSH 已有的会话和模型输入能力。可见的 Agent 卡片只标出未来扩展位置。

<a id="further-exploration"></a>
## 进一步探索

全局面板插槽参见 [ui-layout](../ui-layout/README.zh.md)，侧栏入口插槽参见 [ui-sidebar](../ui-sidebar/README.zh.md)。

<a id="model-experience"></a>
## 模型体验

无，因为这个浏览器端 ERP 演示没有注册面向模型的输入；其浮动对话窗复用 DSH 已有的输入区。

#### KV Cache 影响

无；本包不组装或发送模型提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 菜单和演示登录仅属于当前浏览器配置，清除站点存储后可能丢失。
- 演示密码写在前端代码中，不能用于真实权限保护。
- 业务记录、服务端认证、权限、可访问的页面 URL 和 Agent 编排尚未实现。

<a id="dev-note"></a>
### 开发备注

此包是源码仓库中的本地演示扩展。

**运行时不变量：**不发布 companion。ERP 导航和登录状态只在浏览器内，由各自的存储对象维护；本包没有需要协调的独立服务或进程状态。
