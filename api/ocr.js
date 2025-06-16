const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { createWorker } = tesseract;

module.exports = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // Base64画像データをバッファに変換
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // sharpで前処理（グレースケール化＋二値化）
    const processedImage = await sharp(buffer)
      .grayscale()
      .threshold(150)
      .toBuffer();

    // Tesseractワーカーの作成と初期化
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('jpn');
    await worker.initialize('jpn');

    // パラメータ設定（必要に応じて調整可能）
    await worker.setParameters({
      preserve_interword_spaces: '1',
    });

    // OCR実行
    const { data: { text } } = await worker.recognize(processedImage);
    await worker.terminate();

    // 改行などを除去して整形
    const extractedText = text.replace(/\n/g, '').replace(/\r/g, '');

    // 結果を返す
    res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'OCR processing failed' });
  }
};
