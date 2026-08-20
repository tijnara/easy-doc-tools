import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
    try {
        const body = await req.json();
        const { type, payload } = body;

        const tableMap = {
            text: 'text_history',
            convert: 'pdf_conversion_history',
            split: 'pdf_split_history',
            calculator: 'calculator_history',
            notepad: 'notepad_history',
        };

        const tableName = tableMap[type];
        if (!tableName || !payload) {
            return NextResponse.json({ error: 'Invalid log request' }, { status: 400 });
        }

        const { error } = await supabase.from(tableName).insert([payload]);
        if (error) {
            console.error('Server Log Insert Error:', error.message);
            return NextResponse.json({ error: 'Database logging failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Log Activity Route Exception:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}