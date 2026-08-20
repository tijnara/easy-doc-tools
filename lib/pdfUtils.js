import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Cleans non-printable control characters that crash standard PDF fonts
function sanitizeText(str) {
    if (!str) return '';
    return str
        .replace(/\t/g, '    ')
        .replace(/[\r]/g, '')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[–—]/g, '-')
        .replace(/•/g, '*')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
        .replace(/[^\x20-\x7E\n]/g, '');
}

// 1. PDF & Word Merger (Supports .pdf and .docx)
export async function mergePdfFiles(files) {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        let pdfBytes;
        const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';

        if (ext === 'docx') {
            // Convert .docx file to PDF bytes in memory first
            pdfBytes = await convertDocxToPdf(file);
        } else if (file instanceof ArrayBuffer) {
            pdfBytes = file;
        } else if (file?.arrayBuffer) {
            pdfBytes = await file.arrayBuffer();
        } else {
            pdfBytes = file;
        }

        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
}

// 2. Image to PDF Converter (JPG / PNG)
export async function convertImagesToPdf(imageFiles) {
    const pdfDoc = await PDFDocument.create();

    for (const file of imageFiles) {
        const imageBytes = await file.arrayBuffer();
        let image;

        if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else {
            continue;
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }

    return await pdfDoc.save();
}

// 3. Text to Standard PDF
export async function convertTextToPdf(rawText) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const lineHeight = 14;
    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;
    const maxLineWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const sanitized = sanitizeText(rawText);
    const lines = sanitized.split('\n');

    for (const line of lines) {
        if (!line.trim()) {
            y -= lineHeight;
            if (y < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
            }
            continue;
        }

        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            let testWidth = 0;

            try {
                testWidth = font.widthOfTextAtSize(testLine, fontSize);
            } catch (e) {
                continue;
            }

            if (testWidth > maxLineWidth) {
                if (y - lineHeight < margin) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    y = pageHeight - margin;
                }
                if (currentLine) {
                    page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
                    y -= lineHeight;
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            if (y - lineHeight < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
            }
            page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
            y -= lineHeight;
        }
    }

    return await pdfDoc.save();
}

// 4. Word (.docx) to PDF Converter
export async function convertDocxToPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value || !result.value.trim()) {
        throw new Error('No readable text found in document.');
    }

    return await convertTextToPdf(result.value);
}

// 5. Excel (.xlsx) to PDF Converter
export async function convertExcelToPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';

    workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_csv(worksheet, { FS: '  |  ' });
        fullText += `--- Sheet: ${sheetName} ---\n\n${sheetText}\n\n`;
    });

    return await convertTextToPdf(fullText);
}

// 6. Page Range & Keyword Parser ("odd", "even", "1-4, 4, 6-9")
export function parsePageRanges(rangeStr, totalPages) {
    const pages = new Set();
    if (!rangeStr) return [];
    const cleanStr = rangeStr.toLowerCase().trim();

    if (cleanStr === 'odd') {
        for (let i = 1; i <= totalPages; i += 2) pages.add(i - 1);
        return Array.from(pages);
    }

    if (cleanStr === 'even') {
        for (let i = 2; i <= totalPages; i += 2) pages.add(i - 1);
        return Array.from(pages);
    }

    const parts = cleanStr.split(',');
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;

        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr.trim(), 10);
            const end = parseInt(endStr.trim(), 10);
            if (!isNaN(start) && !isNaN(end)) {
                const min = Math.max(1, Math.min(start, end));
                const max = Math.min(totalPages, Math.max(start, end));
                for (let i = min; i <= max; i++) {
                    pages.add(i - 1);
                }
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum - 1);
            }
        }
    }
    return Array.from(pages).sort((a, b) => a - b);
}

// 7. PDF Page Splitter
export async function splitPdfPages(pdfInput, rangeStr) {
    let arrayBuffer;
    if (pdfInput instanceof ArrayBuffer) {
        arrayBuffer = pdfInput;
    } else if (pdfInput?.arrayBuffer) {
        arrayBuffer = await pdfInput.arrayBuffer();
    } else {
        arrayBuffer = pdfInput;
    }

    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();

    const selectedIndices = parsePageRanges(rangeStr, totalPages);
    if (selectedIndices.length === 0) {
        throw new Error('No valid pages matched your selection criteria.');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    return await newDoc.save();
}

// 8. PDF Page Count Reader
export async function getPdfPageCount(pdfInput) {
    let arrayBuffer;
    if (pdfInput instanceof ArrayBuffer) {
        arrayBuffer = pdfInput;
    } else if (pdfInput?.arrayBuffer) {
        arrayBuffer = await pdfInput.arrayBuffer();
    } else {
        arrayBuffer = pdfInput;
    }

    const srcDoc = await PDFDocument.load(arrayBuffer);
    return srcDoc.getPageCount();
}