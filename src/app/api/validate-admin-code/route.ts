import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Admin code stored securely in environment variables
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE;
const ADMIN_CODE_HASH = process.env.ADMIN_CODE_HASH; // Optional: for hashed validation

export async function POST(req: Request) {
    try {
        const { adminCode } = await req.json();

        if (!adminCode) {
            return NextResponse.json({ 
                isValid: false, 
                message: 'Admin code is required.' 
            }, { status: 400 });
        }

        // Method 1: Direct comparison (if ADMIN_SECRET_CODE is set)
        if (ADMIN_SECRET_CODE && adminCode === ADMIN_SECRET_CODE) {
            return NextResponse.json({ 
                isValid: true, 
                message: 'Admin access granted.' 
            });
        }

        // Method 2: Hash comparison (if ADMIN_CODE_HASH is set)
        if (ADMIN_CODE_HASH) {
            const inputHash = crypto.createHash('sha256').update(adminCode).digest('hex');
            if (inputHash === ADMIN_CODE_HASH) {
                return NextResponse.json({ 
                    isValid: true, 
                    message: 'Admin access granted.' 
                });
            }
        }

        // Method 3: Fallback to default code (only in development)
        if (process.env.NODE_ENV === 'development' && adminCode === 'admin649290docgentor@') {
            console.warn('Using fallback admin code - set ADMIN_SECRET_CODE environment variable for production');
            return NextResponse.json({ 
                isValid: true, 
                message: 'Admin access granted (development mode).' 
            });
        }

        // Log failed attempts (for security monitoring)
        console.log(`Failed admin code attempt: ${adminCode.substring(0, 3)}***`);

        return NextResponse.json({ 
            isValid: false, 
            message: 'Invalid admin code.' 
        }, { status: 401 });

    } catch (error) {
        console.error('Error validating admin code:', error);
        return NextResponse.json({ 
            isValid: false, 
            message: 'Internal server error.' 
        }, { status: 500 });
    }
}