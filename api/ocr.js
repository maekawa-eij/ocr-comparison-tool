<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Image to Text Comparison Tool</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { max-width: 800px; margin: auto; }
    #pasteArea { border: 2px dashed #ccc; padding: 20px; height: 200px; text-align: center; line-height: 160px; color: #999; overflow: auto; }
    #pasteArea img { max-width: 100%; max-height: 180px; }
    textarea { width: 100%; height: 150px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
    .diff-char { background-color: #ffdddd; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Image to Text Comparison Tool</h1>
    <div id="pasteArea" contenteditable="true">ここに画像を Ctrl+V で貼り付けてください</div>
    <button onclick="clearContent()">Clear</button>
    <textarea id="referenceText" placeholder="比較対象のテキストをここに貼り付けてください"></textarea>
    <button onclick="startComparison()">Start Comparison</button>
    <table id="resultTable">
      <thead>
        <tr><th>Extracted Text</th><th>Reference Text</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
  <script>
    let pastedImage = null;

    document.getElementById('pasteArea').addEventListener('paste', function (event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = function (e) {
            pastedImage = new Image();
            pastedImage.src = e.target.result;
            pastedImage.style.maxHeight = '180px';
            pastedImage.style.maxWidth = '100%';
            const area = document.getElementById('pasteArea');
            area.innerHTML = '';
            area.appendChild(pastedImage);
          };
          reader.readAsDataURL(blob);
        }
      }
    });

    function clearContent() {
      document.getElementById('pasteArea').innerHTML = 'ここに画像を Ctrl+V で貼り付けてください';
      document.getElementById('referenceText').value = '';
      document.getElementById('resultTable').getElementsByTagName('tbody')[0].innerHTML = '';
      pastedImage = null;
    }

    function normalizeText(text) {
      return text
        .replace(/[（）]/g, s => s === '（' ? '(' : ')')
        .replace(/[、]/g, ',')
        .replace(/[。]/g, '.')
        .replace(/[：]/g, ':')
        .replace(/[／]/g, '/')
        .replace(/\u3000/g, ' ')
        .replace(/[\r\n\u2028\u2029]+/g, '')
        .replace(/\s+/g, '')
        .trim();
    }

    function highlightDifferences(extracted, reference) {
      const maxLength = Math.max(extracted.length, reference.length);
      let highlightedExtracted = '', highlightedReference = '';
      for (let i = 0; i < maxLength; i++) {
        const eChar = extracted[i] || '';
        const rChar = reference[i] || '';
        if (eChar !== rChar) {
          highlightedExtracted += `<span class="diff-char">${eChar}</span>`;
          highlightedReference += `<span class="diff-char">${rChar}</span>`;
        } else {
          highlightedExtracted += eChar;
          highlightedReference += rChar;
        }
      }
      return { highlightedExtracted, highlightedReference };
    }

    async function startComparison() {
      const referenceText = document.getElementById('referenceText').value;
      const resultTable = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
      if (!pastedImage) {
        alert('画像が貼り付けられていません。');
        return;
      }

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: pastedImage.src })
      });
      const data = await response.json();
      const extractedText = data.text || '';

      const cleanedExtracted = normalizeText(extractedText);
      const cleanedReference = normalizeText(referenceText);
      const { highlightedExtracted, highlightedReference } = highlightDifferences(cleanedExtracted, cleanedReference);

      resultTable.innerHTML = '';
      const row = resultTable.insertRow();
      row.insertCell(0).innerHTML = highlightedExtracted;
      row.insertCell(1).innerHTML = highlightedReference;
    }
  </script>
</body>
</html>
