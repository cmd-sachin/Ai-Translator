import { createGoogleGenerativeAi } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAi({ apiKey: process.env.GOOGLE_API_KEY });

export default async function POST(req) {
  const { audioFile, destLanguage } = await req.json();
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `taskAssigned ${taskAssigned}. Please analyze this video file and Provide a detailed description.`,
        },
        {
          type: "file",
          data: screenRecordingUrl,
          mimeType: "video/mp4",
        },
      ],
    },
  ];
}
