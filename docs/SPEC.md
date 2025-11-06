# ブラウザベース SoC Top RTL 生成UI 仕様書（FlooNoC/floogen 連携）

## 1. 背景・目的
ブラウザ上のGUIでAXIベースのSoC構成（ノード・アドレスマップ・幅など）と各IPのパラメータを編集し、YAMLに落とし込み、`floogen`によりTop RTL（SystemVerilog）と関連パッケージを自動生成する。

PULPの **FlooNoC** が AXI4/ATOPをサポートし、AXI NI (`floo_axi_chimney`) と **YAML→RTL** の生成機構 (`floogen`) を備えるため、これを基盤とする。

---

## 2. システム構成
```mermaid
flowchart LR
  A[Browser UI] --> B[JSON Schema Validator]
  B --> C[Backend API]
  C --> D[floogen Runner]
  D --> E[Generated RTL (SV/PKG)]
  E --> F[Download ZIP / Commit]
```

---

## 3. 主なコンポーネント

| コンポーネント | 技術 | 主機能 |
|----------------|------|--------|
| Frontend | React / TypeScript | GUI構成・YAML生成・バリデーション |
| Backend | Flask (Python 3.10+) | floogen実行・ZIP生成・API提供 |
| Generator | floogen | YAML → SystemVerilog生成 |
| Schema | JSON Schema | フォーム入力検証 |

---

## 4. UI概要

- **構成エディタ**：protocols / endpoints / routers / connections / routing / top
- **バリデーション**：Schema + 幅・アドレス整合チェック
- **出力**：ZIP化したRTLファイル群

---

## 5. API仕様

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /api/validate | YAML構成の検証結果を返す |
| POST | /api/generate | floogen実行、ZIP出力 |
| GET | /api/jobs/:id | 実行結果取得 |
| GET | /api/schemas/current | JSON Schema 取得 |

---

## 6. YAML仕様（例）

```yaml
protocols:
  axi: { data_width: 64, addr_width: 32, id_width: 6 }

endpoints:
  - { name: m0, type: master, protocol: axi, chimneys: [{ name: m0_ch }] }
  - { name: s0, type: slave,  protocol: axi, addr_range: [0x8000_0000, 0x8000_ffff], chimneys: [{ name: s0_ch }] }

routers:
  - { name: r0, pos: [0,0] }

connections:
  - { from: m0_ch, to: r0 }
  - { from: r0, to: s0_ch }

routing: { mode: deterministic }
top: { name: soc_top, export_axi: [m0, s0] }
```

---

## 7. バリデーションルール

- `data_width`, `addr_width`, `id_width` の一致
- `addr_range` の重複/未割り当て検出
- chimney 名称重複禁止
- endpoint と connection の到達性

---

## 8. 生成手順

```bash
pip install .
floogen -c config.yml -o output/
zip -r output.zip output/
```

---

## 9. 開発タスク概要

1. JSON Schema 定義
2. UI → YAML 変換
3. Flask API 実装
4. floogen 実行ラッパ
5. ZIP生成
6. E2Eテスト（最小構成）

---

## 10. ライセンス

Apache-2.0 に準拠。生成物にもヘッダ挿入可能。

---

## 11. 今後の拡張

- Verilator 用 testbench 自動生成
- GitHub Actions による CI (lint / floogen test)
- NoC 可視化 (Canvas / Cytoscape.js)
