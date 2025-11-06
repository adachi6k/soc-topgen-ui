---
name: コード生成とエクスポート機能
about: SystemVerilogやYAML形式でのエクスポート機能
title: '[Export] コード生成とエクスポート機能'
labels: export, codegen, phase-8
assignees: ''

---

## 概要
設計したSoCトポロジーから、SystemVerilogコード、YAML設定ファイル、ドキュメントを生成するエクスポート機能を実装します。

## タスク

### コード生成エンジン
- [ ] src/services/codegen/の作成
- [ ] SystemVerilog生成
  - [ ] モジュール定義
  - [ ] インスタンス化
  - [ ] ポート接続
  - [ ] テンプレートエンジン
- [ ] YAML設定生成
  - [ ] トポロジー定義
  - [ ] コンポーネント設定
- [ ] Markdown/HTMLドキュメント生成
  - [ ] トポロジー図
  - [ ] コンポーネントリスト
  - [ ] 接続テーブル

### エクスポートUI
- [ ] ExportDialogコンポーネント
- [ ] フォーマット選択
  - [ ] SystemVerilog
  - [ ] YAML
  - [ ] Markdown
  - [ ] JSON
- [ ] プレビュー機能
  - [ ] コードプレビュー
  - [ ] シンタックスハイライト
- [ ] ダウンロード機能
  - [ ] ファイル生成
  - [ ] ダウンロードボタン

### テンプレート機能（拡張）
- [ ] カスタムテンプレート対応
- [ ] テンプレート編集UI
- [ ] テンプレートの保存/読み込み

## SystemVerilog出力例
```systemverilog
module top_module (
  input clk,
  input rst_n,
  // ...
);

  // Component instances
  cpu_core u_cpu (
    .clk(clk),
    .rst_n(rst_n),
    // ...
  );

  // Interconnections
  // ...

endmodule
```

## YAML出力例
```yaml
topology:
  name: "My SoC Design"
  components:
    - id: cpu1
      type: cpu_core
      properties:
        frequency: 1000MHz
  connections:
    - source: cpu1.port_out
      target: mem1.port_in
```

## 受け入れ基準
- [ ] SystemVerilogコードを生成できる
- [ ] YAML設定ファイルを生成できる
- [ ] ドキュメントを生成できる
- [ ] プレビューが正しく表示される
- [ ] 生成されたコードが構文的に正しい
- [ ] ファイルをダウンロードできる

## 優先度
中

## 見積もり
8-10時間
