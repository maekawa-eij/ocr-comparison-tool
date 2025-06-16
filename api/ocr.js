const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createWorker } = tesseract;

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

    // 改行と余分な空白を除去
    const cleanedText = text.replace(/\s+/g, '');

    // 原材料名の抽出（例：「原材料名：」から始まる部分を抽出）
    const match = cleanedText.match(/原材料名[:：]?(.*?)(内容量|保存方法|賞味期限|製造者|販売者|アレルゲン|栄養成分|$)/);
    const extractedText = match ? match[1] : '原材料名が見つかりませんでした';

    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
};
