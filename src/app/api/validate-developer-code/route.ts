import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Developer trial codes stored securely in environment variables
const DEVELOPER_TRIAL_CODE = process.env.DEVELOPER_TRIAL_CODE;
const DEVELOPER_CODE_HASH = process.env.DEVELOPER_CODE_HASH; // Optional: for hashed validation

export async function POST(req: Request) {
    try {
        const { developerCode } = await req.json();

        if (!developerCode) {
            return NextResponse.json({ 
                isValid: false, 
                message: 'Developer code is required.' 
            }, { status: 400 });
        }

        // Method 1: Direct comparison (if DEVELOPER_TRIAL_CODE is set)
        if (DEVELOPER_TRIAL_CODE && developerCode === DEVELOPER_TRIAL_CODE) {
            return NextResponse.json({ 
                isValid: true, 
                message: 'Developer trial access granted.' 
            });
        }

        // Method 2: Hash comparison (if DEVELOPER_CODE_HASH is set)
        if (DEVELOPER_CODE_HASH) {
            const inputHash = crypto.createHash('sha256').update(developerCode).digest('hex');
            if (inputHash === DEVELOPER_CODE_HASH) {
                return NextResponse.json({ 
                    isValid: true, 
                    message: 'Developer trial access granted.' 
                });
            }
        }

        // Method 3: Fallback to default code (only in development)
        if (process.env.NODE_ENV === 'development' && developerCode === 'dev2784docgentorai') {
            console.warn('Using fallback developer code - set DEVELOPER_TRIAL_CODE environment variable for production');
            return NextResponse.json({ 
                isValid: true, 
                message: 'Developer trial access granted (development mode).' 
            });
        }

        // Log failed attempts (for security monitoring)
        console.log(`Failed developer code attempt: ${developerCode.substring(0, 3)}***`);

        return NextResponse.json({ 
            isValid: false, 
            message: 'Invalid developer trial code.' 
        }, { status: 401 });

    } catch (error) {
        console.error('Error validating developer code:', error);
        return NextResponse.json({ 
            isValid: false, 
            message: 'Internal server error.' 
        }, { status: 500 });
    }
}