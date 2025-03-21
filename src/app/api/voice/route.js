import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import { Readable } from "stream";

export async function POST(request) {
  try {
    const { transcript } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript in request body." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVEN_LABS_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ELEVEN_LABS_KEY environment variable." },
        { status: 500 }
      );
    }

    const client = new ElevenLabsClient({ apiKey });

    // Call the streaming API via the SDK.
    // Note: convertAsStream returns an async iterator over audio bytes.
    const audioIterator = await client.textToSpeech.convertAsStream(
      "9Ats6C5UrhVXzgyVbnh3",
      {
        output_format: "mp3_44100_128",
        text: transcript,
        model_id: "eleven_multilingual_v2",
      }
    );

    // Convert the async iterator into a Node.js Readable stream.
    const readableStream = Readable.from(audioIterator);

    // Forward the streaming response directly to the client.
    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=output.mp3",
      },
    });
  } catch (error) {
    console.error("Internal error in /api/voice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
