
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Only throw error at runtime, not during build
if (!keySecret && process.env.NODE_ENV !== 'production') {
    console.warn('Razorpay Key Secret is not defined in environment variables. Payment verification will fail.');
}

export async function POST(req: Request) {
    try {
        if (!keySecret) {
            console.error('Razorpay Key Secret is not configured');
            return NextResponse.json({ error: 'Payment verification not configured.' }, { status: 500 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        const isVerified = expectedSignature === razorpay_signature;

        return NextResponse.json({ isVerified }, { status: 200 });

    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
