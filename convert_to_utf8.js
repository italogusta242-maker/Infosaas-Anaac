const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'src');
const extensions = ['.tsx', '.ts', '.css', '.html', '.js', '.cjs'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                results.push(filePath);
            }
        }
    });
    return results;
}

function convertFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    // Check if it's already UTF-8
    // If it has non-ASCII bytes and is NOT valid UTF-8, it's likely Windows-1252
    function isUtf8(buf) {
        let i = 0;
        while (i < buf.length) {
            if (buf[i] <= 0x7F) i++;
            else if (buf[i] >= 0xC2 && buf[i] <= 0xDF) {
                if (i + 1 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80) return false;
                i += 2;
            } else if (buf[i] >= 0xE0 && buf[i] <= 0xEF) {
                if (i + 2 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80) return false;
                i += 3;
            } else if (buf[i] >= 0xF0 && buf[i] <= 0xF4) {
                if (i + 3 >= buf.length || (buf[i + 1] & 0xC0) !== 0x80 || (buf[i + 2] & 0xC0) !== 0x80 || (buf[i + 3] & 0xC0) !== 0x80) return false;
                i += 4;
            } else return false;
        }
        return true;
    }

    if (isUtf8(buffer)) {
        // console.log(`Skipping ${filePath} (already UTF-8)`);
        return false;
    }

    console.log(`Converting ${filePath}...`);
    // Convert from Latin1 (Windows-1252) to UTF-8
    // In Node.js 'latin1' is ISO-8859-1. Windows-1252 is a superset.
    // For most Portuguese text they are identical.
    const content = buffer.toString('latin1');
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

try {
    const files = walk(DIRECTORY);
    files.push(path.join(__dirname, 'index.html'));
    
    let convertedCount = 0;
    files.forEach(file => {
        if (convertFile(file)) {
            convertedCount++;
        }
    });
    
    console.log(`Successfully converted ${convertedCount} files to UTF-8.`);
} catch (error) {
    console.error("Error during conversion:", error);
}
