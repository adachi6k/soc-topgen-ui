# SoC TopGen UI - 仕様書

## プロジェクト概要

SoC TopGen UIは、System on Chip（SoC）のトポロジーを視覚的に設計・生成するためのWebベースのUIアプリケーションです。

## 目的

- SoCアーキテクチャの視覚的な設計を可能にする
- トポロジー定義の生成と管理を簡素化する
- 設計の検証とエクスポート機能を提供する

## 主要機能

### 1. ビジュアルエディタ

- **ドラッグ&ドロップインターフェース**
  - コンポーネントの配置と接続
  - グラフィカルなトポロジー表示
  - リアルタイムプレビュー

- **コンポーネントライブラリ**
  - プロセッサコア
  - メモリコントローラ
  - インターコネクト
  - ペリフェラル
  - カスタムコンポーネント

### 2. トポロジー管理

- **設計の保存/読み込み**
  - JSON形式でのエクスポート/インポート
  - 複数プロジェクトの管理
  - バージョン履歴

- **検証機能**
  - トポロジーの整合性チェック
  - 接続の検証
  - リソースの競合チェック

### 3. コード生成

- **エクスポート機能**
  - SystemVerilog
  - YAML設定ファイル
  - ドキュメント生成

## 技術スタック

### フロントエンド

- **フレームワーク**: React 18+
- **言語**: TypeScript
- **状態管理**: Redux Toolkit / Zustand
- **UIライブラリ**: Material-UI / Ant Design
- **グラフィックス**: React Flow / D3.js
- **ビルドツール**: Vite

### 開発ツール

- **テスト**: Jest, React Testing Library
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **型チェック**: TypeScript

## アーキテクチャ

### ディレクトリ構造

```
soc-topgen-ui/
├── src/
│   ├── components/     # 再利用可能なUIコンポーネント
│   ├── pages/          # ページコンポーネント
│   ├── hooks/          # カスタムReactフック
│   ├── services/       # API通信、ビジネスロジック
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── docs/               # ドキュメント
├── tests/              # テストファイル
├── config/             # 設定ファイル
└── public/             # 静的ファイル
```

### データモデル

#### Component（コンポーネント）

```typescript
interface Component {
  id: string;
  type: ComponentType;
  name: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  ports: Port[];
}
```

#### Connection（接続）

```typescript
interface Connection {
  id: string;
  source: { componentId: string; portId: string };
  target: { componentId: string; portId: string };
  type: ConnectionType;
}
```

#### Topology（トポロジー）

```typescript
interface Topology {
  id: string;
  name: string;
  components: Component[];
  connections: Connection[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}
```

## ユーザーインターフェース

### メインビュー

1. **ツールバー**
   - 新規作成、開く、保存
   - エクスポート
   - 表示設定

2. **コンポーネントパネル**
   - コンポーネントライブラリ
   - 検索機能
   - カテゴリ分類

3. **キャンバス**
   - トポロジー編集エリア
   - ズーム/パン操作
   - グリッド表示

4. **プロパティパネル**
   - 選択中のコンポーネント設定
   - 接続設定
   - 検証結果

## 非機能要件

### パフォーマンス

- 初期ロード時間: 3秒以内
- 大規模トポロジー（100+コンポーネント）でもスムーズな操作
- リアルタイムバリデーション

### ユーザビリティ

- 直感的なUI/UX
- キーボードショートカット対応
- アンドゥ/リドゥ機能

### セキュリティ

- 入力値の検証
- XSS対策
- CSRF対策（バックエンド連携時）

## 開発フェーズ

詳細は `docs/ROADMAP.md` を参照してください。

## 今後の拡張

- バックエンドAPI統合
- コラボレーション機能
- AIによる設計支援
- シミュレーション連携
- クラウド保存機能

## 参考資料

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Flow Documentation](https://reactflow.dev/)
