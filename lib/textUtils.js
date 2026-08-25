export function removeExtraSpaces(text, mode = 'blank-lines') {
    if (!text) return '';

    if (mode === 'all-lines') {
        return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (mode === 'strip-bullets') {
        return text
            // Strip out all star glyphs, symbol variants, and dingbats
            .replace(/[★☆⭐🌟✨✪✩✰⭒\u2600-\u26FF\u2700-\u27BF]+/g, '')
            .split('\n')
            .map((line) => line.replace(/^[\s•*▪\-►–—\u2022\u25cf\u25aa\u25a0]+/g, '').trim())
            .filter((line) => line.length > 0)
            .join('\n');
    }

    // Default 'blank-lines': Removes empty lines while keeping line text
    return text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n');
}