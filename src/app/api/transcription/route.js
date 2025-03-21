import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import systemPrompt from "../../prompts/trancription";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function POST(request) {
  try {
    const { audioFileBase64, destLanguage } = await request.json();

    if (!audioFileBase64 || !destLanguage) {
      return NextResponse.json(
        { error: "Missing audio file or destination language." },
        { status: 400 }
      );
    }
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Transcript this video to ${destLanguage}`,
          },
          {
            type: "file",
            data: audioFileBase64,
            mimeType: "audio/mp3",
          },
        ],
      },
    ];

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: z.object({
        destinationTranscript: z.string(),
        sourceLanguage: z.string(),
      }),
      messages,
      system: systemPrompt,
      temperature: 0.2,
    });

    return NextResponse.json(result.object, { status: 200 });
  } catch (error) {
    console.error("Error in transcription endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
