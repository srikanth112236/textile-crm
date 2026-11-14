import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Only video files are allowed' }, { status: 400 });
    }

    // 50MB — matches the backend multer limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Video size must be less than 50MB' }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('video', file);

    const accessToken = (session as any)?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/upload/product-video`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to upload video' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Product video upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}
