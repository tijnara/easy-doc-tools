import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';

export async function GET() {
    try {
        const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
        const secretKey = process.env.ILOVEPDF_SECRET_KEY;

        if (!publicKey || !secretKey) {
            return NextResponse.json(
                { error: 'iLovePDF keys missing in environment variables.' },
                { status: 500 }
            );
        }

        // Connect to iLoveAPI server and start a session
        const instance = new ILovePDFApi(publicKey, secretKey);
        const task = instance.newTask('officepdf');
        await task.start();

        // task.remainingFiles returns live available credits directly from iLoveAPI
        return NextResponse.json({
            remaining: task.remainingFiles ?? 0,
            success: true
        });
    } catch (error) {
        console.error('iLoveAPI Credits API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch live credits from iLoveAPI' },
            { status: 500 }
        );
    }
}