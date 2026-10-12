---
description: "Browse a local cross-border ERP demo panel inside the DSH Web client."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-erp-demo

English | [中文](README.zh.md)

## Summary

The **Cross-border ERP** navigation opens a browser-only ERP demonstration with Sales, Products, Warehouses, Procurement, Inventory, WMS, Administration, and Settings. Each section shows sample fields and rows. Settings includes a menu editor for up to three levels.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>
## Use this package

Run the Web profile from this checkout. A standalone login screen covers the full page until sign-in succeeds, then the Workbench opens. A saved login restores the previously selected ERP page or Conversation after a reload. **Sign out** returns to the login screen, and invalid credentials never enter the main interface. The demo login is `admin` / `123456`. It is a browser-only interface gate, not server authentication, and currently has no expiry. The sidebar shows the blue-purple Cross-border ERP brand, hides its separate top-level New Session button, and uses a dashboard icon for Workbench. The ERP menu section scrolls independently and ends with Database / Skills / Plugins under **Data & Tools**. The original DSH workspace area remains below it. The bottom-right button opens a dismissible floating window over the ERP panel, embedding DSH’s native Conversation without changing the current ERP page.

Set `DSH_CLIENT_TITLE=跨境ERP` when building the local ERP Web client to select the matching favicon, ERP PWA manifest, and browser title. Other DSH builds retain their existing brand assets.

Use **Menu settings** to add, edit, hide, sort, or remove menu entries. The page redraws navigation immediately. Menu definitions live in this browser's `localStorage` under `dsh-erp-demo.menus.v1`, while `dsh-erp-demo.page.v1` stores the selected ERP page and `dsh-erp-demo.main-view.v1` stores the main view choice; **Reset menus** restores the shipped defaults. The path field is a reserved routing identifier: within this preview, selecting a menu changes the panel's local view without changing the browser address. Sample business rows are fixed in `src/client/model.ts`.

On the Workbench, **My tasks** keeps task starts and completions in page memory only. Starting requires confirmation; completion presents result choices for the task type, removes the task from the list, and updates its count. Reloading restores all sample tasks.

Unread notification cards open read-only detail dialogs with sample content for each notification type; opening and closing them leaves all Workbench counts unchanged.

<a id="understand-the-implementation"></a>
## Understand the implementation

The plugin registers one `main` keyed panel, one `sidebar.erp-navigation` region, and one `shell.overlay` full-page login gate. The main panel and sidebar share ERP navigation state; `model.ts` owns the default menu, sample records, and local menu persistence; `demoState.ts` shares browser-local login state between the login screen and logout button. No Host API, Session event, database, role check, or Agent action is added; the floating window uses DSH’s existing Session and model input. The visible Agent card only marks a future extension point.

<a id="further-exploration"></a>
## Further Exploration

See [ui-layout](../ui-layout/README.md) for the global panel slot and [ui-sidebar](../ui-sidebar/README.md) for the sidebar entry slot.

<a id="model-experience"></a>
## Model Experience

None, as this browser-side ERP demo registers no model-facing input; its floating Conversation uses the existing DSH input.

#### KV Cache effect

None; this package does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Menus and the demo login belong to one browser profile and may be lost when site storage is cleared.
- The demo password is present in frontend code and cannot secure real data.
- Business records, server authentication, permissions, route URLs, and Agent orchestration are not implemented.

<a id="dev-note"></a>
### Dev Note

This package is a local demonstration extension in the source checkout.

**Runtime invariant:** No companion is published. ERP navigation and login state are browser-local and owned by their stores; this package has no independent service or process state to reconcile.
