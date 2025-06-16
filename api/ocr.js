const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createWorker } = tesseract;

// 全角→半角の正規化関数
function normalizeText(text) {
  return text
    .replace(/[（）]/g, (s) => s === '（' ? '(' : ')')  // 括弧
    .replace(/[、]/g, ',')                              // 読点
    .replace(/[。]/g, '.')                              // 句点
    .replace(/[：]/g, ':')                              // コロン
    .replace(/[／]/g, '/')                              // スラッシュ
    .replace(/　/g, ' ')                                // 全角スペース
    .trim();
}

// 原材料名だけを抽出する関数
function extractIngredients(rawText) {
  const cleaned = rawText.replace(/\s+/g, '');
  const match = cleaned.match(/原材料名[:：]?(.*?)(内容量|賞味期限|保存方法|製造者|販売者|栄養成分|$)/);

  if (!match) return '原材料名が見つかりませんでした';

  let ingredients = match[1];

  // ノイズ除去（日本語・英数字・記号以外を削除）
  ingredients = ingredients.replace(/[^一-龯ぁ-んァ-ンーa-zA-Z0-9（）・,、／\/]/g, '');

  // 全角→半角の正規化
  return normalizeText(ingredients);
}

module.exports = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const processedImage = await sharp(buffer)
      .grayscale()
      .threshold(150)
      .toBuffer();

    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('jpn');
    await worker.initialize('jpn');
    await worker.setParameters({
      preserve_interword_spaces: '1',
    });

    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();

    const extractedText = extractIngredients(text);

    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
};
