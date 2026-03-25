const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'src');
const extensions = ['.tsx', '.ts', '.css', '.html', '.js', '.cjs'];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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

function fixDoubleEncoding(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common double-encoding signatures: Ã followed by a byte that would complete a UTF-8 sequence
    // Example: Ã£ (C3 83 C2 A3), Ã§ (C3 83 C2 A7), Ã¡ (C3 83 C2 A1)
    if (!content.includes('Ã')) return false;

    console.log(`Potential double-encoding in ${filePath}`);
    
    // We try to "un-double-encode" by treating the UTF-8 string as an array of Latin1 bytes
    // and then re-decoding that byte array as UTF-8.
    try {
        const fixedBuffer = Buffer.from(content, 'latin1');
        // Validate that the result is valid UTF-8 and contains the expected fixed characters
        const fixedContent = fixedBuffer.toString('utf8');
        
        // If the content changed and seems more correct (contains less 'Ã' and more accented chars)
        if (fixedContent !== content) {
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            return true;
        }
    } catch (e) {
        console.error(`Failed to fix ${filePath}: ${e.message}`);
    }
    return false;
}

try {
    const files = walk(DIRECTORY);
    // Include root files
    ['index.html', 'vite.config.ts', 'tailwind.config.ts'].forEach(f => {
        const p = path.join(__dirname, f);
        if (fs.existsSync(p)) files.push(p);
    });

    let fixedCount = 0;
    files.forEach(file => {
        if (fixDoubleEncoding(file)) {
            fixedCount++;
        }
    });
    
    console.log(`Successfully repaired ${fixedCount} files.`);
} catch (error) {
    console.error("Error during repair:", error);
}
