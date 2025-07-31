
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';
import { getAppSettings } from '@/ai/flows/get-app-settings';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Only warn during development, handle gracefully at runtime
if ((!keyId || !keySecret) && process.env.NODE_ENV !== 'production') {
    console.warn('Razorpay Key ID or Key Secret is not defined in environment variables. Payment creation will fail.');
}

let instance: any = null;
if (keyId && keySecret) {
    instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export async function POST(req: Request) {
    try {
        if (!instance) {
            console.error('Razorpay is not properly configured');
            return NextResponse.json({ error: 'Payment service not configured.' }, { status: 500 });
        }

        const { plan } = await req.json();

        if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
            return NextResponse.json({ error: 'Invalid plan provided.' }, { status: 400 });
        }

        // Fetch the latest prices from the server-side settings
        const appSettings = await getAppSettings();
        if (!appSettings) {
             return NextResponse.json({ error: 'Could not retrieve pricing information.' }, { status: 500 });
        }

        const amount = plan === 'monthly' ? appSettings.monthlyPrice : appSettings.yearlyPrice;
        
        // Amount must be in the smallest currency unit (paise for INR)
        const amountInPaise = amount * 100;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${randomBytes(4).toString('hex')}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
        }
        
        return NextResponse.json(order, { status: 200 });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
