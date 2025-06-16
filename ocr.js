const tesseract = require('tesseract.js');
const { createWorker } = tesseract;

module.exports = async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage('jpn');
  await worker.initialize('jpn');

  const { data: { text } } = await worker.recognize(image);
  await worker.terminate();

  const extractedText = text.replace(/\n/g, '').replace(/\r/g, '');
  res.status(200).json({ text: extractedText });
};
