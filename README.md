# AirHamLog Bridge

WSJT-X / JTDX から送信される ADIF データを [AirHamLog](https://air-hamlog.com/) に自動入力するブラウザ拡張機能です。

## 機能

- ローカルの HAMLAB Bridge サーバーから WebSocket 経由で ADIF を受信
- AirHamLog のログ入力フォームに自動入力
  - コールサイン、日付、時刻、周波数、RST、モード、グリッドロケーター 等
- JCC/JCG、QTH、Grid（高精度）、オペレーター名の補完に対応
- **受信QTHの自動選択** - 相手のQTH（例: `2901`）が補完された場合、完全一致する候補（例: `JCC2901:`）が自動的に選択されます
- 確認ダイアログの表示/非表示を選択可能
- カード交換、QSLカード用Remarks、固定メモの自動入力

## 対応ブラウザ

- Chrome / Edge などの Chromium 系ブラウザ
- Firefox

## 必要なもの

- HAMLAB Bridge サーバー（`ws://127.0.0.1:17800/ws` で待ち受け）
  - [udp-bridge](https://github.com/itcom/udp-bridge) - WSJT-X/JTDX からの UDP パケットを受信し、WebSocket で配信するサーバー
  - CAT/CI-V 連携にも対応（無線機の周波数・モード取得）

## インストール

### Chrome / Edge

#### リリース版

1. [Releases](../../releases) ページから最新の `air-hamlog-bridge-vX.X.X-chrome.zip` をダウンロード
2. zip を展開
3. Chrome で `chrome://extensions` を開く
4. 右上の「デベロッパーモード」を有効にする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 展開した `chrome-mv3-prod` フォルダを選択

#### 開発版

```bash
yarn install
yarn dev
```

`build/chrome-mv3-dev` をブラウザの拡張機能ページで読み込んでください。

#### 本番ビルド

```bash
yarn build
```

`build/chrome-mv3-prod` が生成されます。

### Firefox

#### リリース版

1. [Releases](../../releases) ページから最新の `air-hamlog-bridge-vX.X.X-firefox.zip` をダウンロード
2. zip を展開
3. Firefox で `about:debugging#/runtime/this-firefox` を開く
4. 「一時的なアドオンを読み込む」をクリック
5. 展開したフォルダ内の `manifest.json` を選択

#### 開発版

```bash
yarn install
yarn dev:firefox
```

`build/firefox-mv2-dev` をFirefoxの拡張機能ページで読み込んでください。

#### 本番ビルド

```bash
yarn build:firefox
```

`build/firefox-mv2-prod` が生成されます。

## 設定

拡張機能のオプションページから以下を設定できます。

| 項目 | 説明 |
|------|------|
| 確認ダイアログ | 登録前に確認ダイアログを表示するか |
| カード交換 | QSLカードの交換方法（JARL Bureau / No Card / 1WAY 等） |
| Remarks（QSLカード用） | QSLカードに印字される文言 |
| Remarks1（固定入力） | 毎回メモ欄に自動追加される文言 |

## ライセンス

MIT
