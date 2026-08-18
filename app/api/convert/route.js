import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js';

export async function POST(req) {
    let tempFilePath = null;

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ error: 'No file provided.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save uploaded file temporarily to OS temp folder
        tempFilePath = join(tmpdir(), `${Date.now()}_${file.name}`);
        writeFileSync(tempFilePath, buffer);

        // Initialize iLovePDF API client
        const instance = new ILovePDFApi(
            process.env.ILOVEPDF_PUBLIC_KEY,
            process.env.ILOVEPDF_SECRET_KEY
        );

        // Create office to pdf conversion task
        const task = instance.newTask('officepdf');
        await task.start();

        // Upload using temp file path
        const pdfFile = new ILovePDFFile(tempFilePath);
        await task.addFile(pdfFile);
        await task.process();

        const pdfBuffer = await task.download();

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '')}.pdf"`,
            },
        });
    } catch (error) {
        console.error('iLovePDF Conversion Error:', error);
        return Response.json(
            { error: `Conversion failed: ${error.message || 'iLovePDF error'}` },
            { status: 500 }
        );
    } finally {
        // Clean up temporary file from disk
        if (tempFilePath) {
            try {
                unlinkSync(tempFilePath);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}