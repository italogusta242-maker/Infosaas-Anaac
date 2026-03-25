const fs = require('fs');
const path = require('path');

function isUtf8(buffer) {
  let i = 0;
  while (i < buffer.length) {
    if (buffer[i] <= 0x7F) { // 0xxxxxxx
      i++;
    } else if (buffer[i] >= 0xC2 && buffer[i] <= 0xDF) { // 110xxxxx 10xxxxxx
      if (i + 1 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80) return false;
      i += 2;
    } else if (buffer[i] >= 0xE0 && buffer[i] <= 0xEF) { // 1110xxxx 10xxxxxx 10xxxxxx
      if (i + 2 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) return false;
      i += 3;
    } else if (buffer[i] >= 0xF0 && buffer[i] <= 0xF4) { // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      if (i + 3 >= buffer.length || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) return false;
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

const filesToCheck = [
  'src/pages/admin/AdminUsuarios.tsx',
  'src/pages/AuthPage.tsx',
  'src/App.tsx',
  'index.html',
  'src/main.tsx'
];

let results = '';
filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    const utf8 = isUtf8(buffer);
    const hasNonAscii = buffer.some(b => b > 127);
    results += `${file}: UTF-8=${utf8}, hasNonAscii=${hasNonAscii}\n`;
    if (hasNonAscii && !utf8) {
        // Log some bytes around the first non-ascii character
        const idx = buffer.findIndex(b => b > 127);
        results += `  Found non-UTF8 byte ${buffer[idx]} at index ${idx}\n`;
        results += `  Context: ${buffer.slice(Math.max(0, idx-10), Math.min(buffer.length, idx+10)).join(', ')}\n`;
    }
  } else {
    results += `${file}: Not found\n`;
  }
});

fs.writeFileSync('encoding_results.txt', results);
console.log('Results written to encoding_results.txt');
