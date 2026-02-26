# Gemma チャットアプリ

ローカルで実行するLLM「Gemma」に接続して、日本語でチャットができるアプリケーションです。
Gemmaを利用したアプリ開発のテストアプリです。

## 機能

- 🤖 Gemmaとの日本語対話
- 💬 会話履歴の保持
- ⚡ リアルタイムレスポンス
- 📱 レスポンシブデザイン

## 必要な環境

### 1. Node.js のインストール

[nodejs.org](https://nodejs.org/)から最新のLTS版をダウンロード・インストールしてください。

### 2. Ollama のインストール

ローカルでGemmaを実行するため、Ollamaをインストールして実行する必要があります。

**macOS:**
```bash
# Homebrewを使用
brew install ollama

# またはダウンロード
# https://ollama.ai からダウンロード
```

**Windows/Linux:** 
公式サイト: https://ollama.ai

### 3. Gemmaモデルのプル

Ollamaをインストール・起動後、以下のコマンドでGemmaをダウンロード:

```bash
ollama pull gemma
```

初回は時間がかかります。（モデルサイズ: 約4-7GB）

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. アプリの起動

Ollamaが起動していることを確認してから実行:

```bash
npm run dev
```

サーバーが起動したら、ブラウザで以下のURLにアクセス:

```
http://localhost:3000
```

## 使用方法

1. ブラウザのチャットウインドウにメッセージを入力
2. **Enter キー** を押すか、**送信ボタン** をクリック
3. Gemmaから回答が返ってきます

### キーボードショートカット

- **Enter**: メッセージを送信
- **Shift + Enter**: 改行を挿入
- **クリア**: チャット履歴を削除

## トラブルシューティング

### "Ollamaサーバーに接続できません"

```bash
# Ollamaが起動していることを確認
# macOS/LinuxはTerminalで:
ollama serve

# またはバックグラウンド起動:
ollama serve &
```

### "Gemmaモデルが見つかりません"

```bash
# Gemmaをプル
ollama pull gemma

# バージョンを確認
ollama list
```

### ポート 3000 が既に使用されている場合

環境変数で別のポートを指定:

```bash
PORT=3001 npm run dev
```

### Ollamaのパスが異なる場合

環境変数で Ollama API URL を指定:

```bash
OLLAMA_API_URL=http://your-ollama-host:11434/api/generate npm run dev
```

## ビルド

本番用にコンパイル:

```bash
npm run build
npm start
```

## 技術スタック

- **フロントエンド**: HTML5 + Vanilla JavaScript
- **バックエンド**: Node.js + Express + TypeScript
- **LLM**: Ollama + Gemma
- **HTTP クライアント**: axios

## ファイル構成

```
.
├── package.json           # プロジェクト設定
├── tsconfig.json          # TypeScript設定
├── src/
│   └── server.ts          # Express サーバー
└── public/
    └── index.html         # チャットUI
```

## ライセンス

MIT

## サポート

何か問題がある場合、上記のトラブルシューティングを参照してください。
