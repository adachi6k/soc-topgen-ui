---
name: CI/CDパイプラインの構築
about: GitHub Actionsを使ったCI/CDの設定
title: '[CI/CD] GitHub Actionsワークフローの構築'
labels: ci-cd, phase-1
assignees: ''

---

## 概要
GitHub Actionsを使用して、自動テスト、リンターチェック、ビルド検証を行うCI/CDパイプラインを構築します。

## タスク
- [ ] .github/workflows/ci.ymlの作成
- [ ] プルリクエスト時の自動テスト実行設定
- [ ] ESLintチェックの自動実行
- [ ] TypeScript型チェックの自動実行
- [ ] ビルドの自動検証
- [ ] コードカバレッジレポートの生成

## ワークフロー内容
```yaml
- Lint (ESLint)
- Type Check (TypeScript)
- Test (Jest)
- Build (Vite)
```

## 受け入れ基準
- [ ] PRを作成すると自動でCIが実行される
- [ ] すべてのチェックが成功時にグリーンステータスが表示される
- [ ] 失敗時に適切なエラーメッセージが表示される

## 優先度
高

## 見積もり
2-3時間
