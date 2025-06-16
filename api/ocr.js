const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createWorker } = tesseract;

function normalizeText(text) {
  return text
    .replace(/[（）]/g, s => s === '（' ? '(' : ')')
    .replace(/[、]/g, ',')
    .replace(/[。]/g, '.')
    .replace(/[：]/g, ':')
    .replace(/[／]/g, '/')
    .replace(/　/g, ' ')
    .replace(/[\r\n\u2028\u2029]+/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function extractIngredients(rawText) {
  const cleaned = rawText.replace(/[\r\n\u2028\u2029]+/g, '').replace(/\s+/g, '');
  const match = cleaned.match(/原材料名[:：]?(.*?)(内容量|賞味期限|保存方法|製造者|販売者|栄養成分|$)/);
  if (!match) return '原材料名が見つかりませんでした';
  return normalizeText(match[1]);
}

module.exports = async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image data provided' });

  try {
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const processedImage = await sharp(buffer).grayscale().threshold(150).toBuffer();

    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('jpn');
    await worker.initialize('jpn');
    await worker.setParameters({ preserve_interword_spaces: '1' });

    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();

    const extractedText = extractIngredients(text);
    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
};
