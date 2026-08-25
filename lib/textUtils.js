export function removeExtraSpaces(text, mode = 'blank-lines') {
    if (!text) return '';

    if (mode === 'all-lines') {
        return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (mode === 'strip-bullets') {
        return text
            .replace(/[\uE000-\uF8FF★☆⭐🌟✨✪✩✰⭒\u2600-\u26FF\u2700-\u27BF]+/g, '')
            .split('\n')
            .map((line) => line.replace(/^[\s•*▪\-►–—\u2022\u25cf\u25aa\u25a0]+/g, '').trim())
            .filter((line) => line.length > 0)
            .join('\n');
    }

    return text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n');
}

export function cleanPastedText(rawText) {
    if (!rawText) return '';

    return rawText
        // 1. Convert non-breaking spaces (\u00A0) to standard spaces
        .replace(/\u00A0/g, ' ')
        // 2. Remove Outlook PUA icon glyphs (\uE000-\uF8FF including ), stars & dingbats
        .replace(/[\uE000-\uF8FF★☆⭐🌟✨✪✩✰⭒\u2600-\u26FF\u2700-\u27BF]+/g, '')
        // 3. Remove AI disclaimer lines
        .replace(/AI-generated content may be incorrect\.?/gi, '')
        // 4. Remove auto-generated logo and image alt descriptions
        .replace(/(A|An|The)?\s*[\w\s,-]*(logo|graphic|icon|banner|image|picture)\b\.?/gi, '');
}