# OCR Comparison Tool

このプロジェクトは、画像から文字を抽出し、参照テキストと比較して違いをハイライト表示するOCR比較ツールです。

## 📁 構成

- `public/index.html`: フロントエンド（画像アップロード・比較）
- `api/ocr.js`: Vercel用OCR API（tesseract.js使用）

## 🚀 セットアップ手順

### GitHub

1. GitHubで新しいリポジトリを作成
2. 上記の3ファイルをそれぞれ対応するフォルダにアップロード
   - `index.html` → `public/` フォルダ
   - `ocr.js` → `api/` フォルダ
   - `README.md` → ルート

### Vercel

1. Vercel にログイン
2. 「Add New Project」→ GitHubと連携
3. このリポジトリを選択してデプロイ
4. 公開URLが発行され、誰でもアクセス可能に！

## ✅ 使い方

1. ブラウザで公開URLを開く
2. 画像をアップロード
3. 比較したいテキストを入力
4. 「Compare」ボタンをクリック

## 📝 備考

- OCRは日本語に対応（tesseract.js + jpn）
- 差分は色付きで表示されます
