---
name: 状態管理のセットアップ
about: Redux ToolkitまたはZustandによる状態管理の実装
title: '[State] 状態管理のセットアップ'
labels: state-management, redux, phase-3
assignees: ''

---

## 概要
アプリケーション全体の状態管理を実装します。Redux Toolkit または Zustand を使用します。

## タスク
- [ ] 状態管理ライブラリの選定と導入
  - [ ] Redux Toolkit / Zustand のインストール
- [ ] ストア構造の設計
- [ ] スライス/ストアの実装
  - [ ] topologySlice（トポロジー状態）
  - [ ] uiSlice（UI状態）
  - [ ] selectionSlice（選択状態）
- [ ] アクション/リデューサーの実装
  - [ ] addComponent
  - [ ] removeComponent
  - [ ] updateComponent
  - [ ] addConnection
  - [ ] removeConnection
- [ ] セレクターの実装
- [ ] Providerのセットアップ

## 状態構造例

```typescript
{
  topology: {
    current: Topology | null,
    components: Component[],
    connections: Connection[]
  },
  ui: {
    selectedComponentId: string | null,
    zoom: number,
    pan: { x: number, y: number }
  },
  selection: {
    selectedIds: string[]
  }
}
```

## 受け入れ基準
- [ ] ストアが正しく設定されている
- [ ] すべての基本アクションが実装されている
- [ ] コンポーネントからストアにアクセス可能
- [ ] 状態の変更が正しく反映される

## 優先度
最高

## 見積もり
4-5時間
