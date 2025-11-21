import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from '@stream-io/node-sdk';

const streamClient = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const requestUserId = body.userId || userId;

    const token = streamClient.generateUserToken({ 
      user_id: requestUserId,
      validity_in_seconds: 3600
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}