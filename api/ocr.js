const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createWorker } = tesseract;

// 全角→半角の正規化関数
function normalizeText(text) {
  return text
    .replace(/[（）]/g, (s) => s === '（' ? '(' : ')')
    .replace(/[、]/g, ',')
    .replace(/[。]/g, '.')
    .replace(/[：]/g, ':')
    .replace(/[／]/g, '/')
    .replace(/　/g, ' ')
    .trim();
}

// 原材料名だけを抽出する関数（改行・ノイズ対応）
function extractIngredients(rawText) {
  // 改行・空白を除去して1行に整形
  const cleaned = rawText.replace(/[\r\n]+/g, '').replace(/\s+/g, '');

  // ノイズ除去（意味不明な記号や数字の羅列を削除）
  const denoised = cleaned.replace(/[^\w一-龯ぁ-んァ-ンー（）・,、／\/]/g, '');

  // 原材料名の範囲を抽出
  const match = denoised.match(/原材料名[:：]?(.*?)(内容量|賞味期限|保存方法|製造者|販売者|栄養成分|$)/);

  if (!match) return '原材料名が見つかりませんでした';

  let ingredients = match[1];

  // 全角→半角の正規化
  return normalizeText(ingredients);
}

module.exports = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // Base64画像をバッファに変換し、前処理（グレースケール＋二値化）
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const processedImage = await sharp(buffer)
      .grayscale()
      .threshold(150)
      .toBuffer();

    // Tesseractワーカーの初期化とOCR実行
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('jpn');
    await worker.initialize('jpn');
    await worker.setParameters({
      preserve_interword_spaces: '1',
    });

    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();

    // 原材料名の抽出と整形
    const extractedText = extractIngredients(text);

    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
};
