# HAMLAB Bridge

WSJT-X / JTDX から送信される ADIF データを [HAMLAB](https://hamlab.jp/) に自動入力する Chrome 拡張機能です。

## 機能

- ローカルの HAMLAB Bridge サーバーから WebSocket 経由で ADIF を受信
- HAMLAB のログ入力フォームに自動入力
  - コールサイン、日付、時刻、周波数、RST、モード、グリッドロケーター 等
- JCC/JCG、QTH、Grid（高精度）、オペレーター名の補完に対応
- 確認ダイアログの表示/非表示を選択可能
- 設備情報（無線機、アンテナ、地上高）の自動入力

## 必要なもの

- HAMLAB Bridge サーバー（`ws://127.0.0.1:17800/ws` で待ち受け）
- Chrome / Edge などの Chromium 系ブラウザ

## インストール

### リリース版

1. [Releases](../../releases) ページから最新の `hamlab-bridge-vX.X.X.zip` をダウンロード
2. zip を展開
3. Chrome で `chrome://extensions` を開く
4. 右上の「デベロッパーモード」を有効にする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 展開した `chrome-mv3-prod` フォルダを選択

### 開発版

```bash
yarn install
yarn dev
```

`build/chrome-mv3-dev` をブラウザの拡張機能ページで読み込んでください。

### 本番ビルド

```bash
yarn build
```

`build/chrome-mv3-prod` が生成されます。

## 設定

拡張機能のオプションページから以下を設定できます。

| 項目 | 説明 |
|------|------|
| 確認ダイアログ | 登録前に確認ダイアログを表示するか |
| Remarks1 | 固定で入力する文言 |
| 無線機 | 無線機名（例: IC-7300） |
| アンテナ | アンテナ名（例: ZS6BKW） |
| 地上高 | アンテナ地上高（m） |

## ライセンス

MIT
