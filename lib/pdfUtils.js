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

// 1. PDF Merger
export async function mergePdfFiles(files) {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
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