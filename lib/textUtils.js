export function removeExtraSpaces(text, mode = 'blank-lines') {
    if (!text) return '';

    if (mode === 'all-lines') {
        return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (mode === 'strip-bullets') {
        return text
            // Strip out star placeholders anywhere in the text (like copied email logos)
            .replace(/[★☆\u2605\u2606]+/g, '')
            .split('\n')
            .map((line) => line.replace(/^[\s•*▪\-►–—\u2022\u25cf\u25aa\u25a0]+/g, '').trim())
            .filter((line) => line.length > 0)
            .join('\n');
    }

    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
}