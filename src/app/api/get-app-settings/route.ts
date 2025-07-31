import { NextResponse } from 'next/server';
import { getAppSettings } from '@/ai/flows/get-app-settings';

export async function GET() {
    try {
        const settings = await getAppSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching app settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch app settings' },
            { status: 500 }
        );
    }
}