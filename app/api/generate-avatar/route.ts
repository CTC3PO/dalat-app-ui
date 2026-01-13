import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { displayName } = await request.json();

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI generation is not configured" },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      } as never,
    });

    // Dalat-inspired avatar prompt
    const nameContext = displayName?.trim()
      ? `for someone named "${displayName}"`
      : "for a friendly person";

    const prompt = `Create a beautiful, artistic avatar portrait ${nameContext}.

Style: Dreamy, ethereal digital art inspired by Da Lat, Vietnam's misty highlands.
Colors: Soft pastels with hints of misty purple, pine forest green, warm sunset orange, and flower pink.
Feel: Warm, welcoming, and slightly magical - like a peaceful morning in the mountains.
Composition: Abstract or stylized portrait, centered, suitable for a circular avatar crop.
Background: Soft gradient or gentle atmospheric elements (mist, soft bokeh, subtle nature motifs).
Important:
- Abstract/artistic style, NOT photorealistic
- Do NOT include any text or lettering
- Square 1:1 aspect ratio
- Suitable for use as a profile picture`;

    console.log("[generate-avatar] Calling Gemini for avatar generation");

    const result = await model.generateContent(prompt);
    const response = result.response;

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error("[generate-avatar] No parts in response");
      throw new Error("No response from AI model");
    }

    const imagePart = parts.find(
      (part) => "inlineData" in part && part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart || !("inlineData" in imagePart)) {
      console.error("[generate-avatar] No image part found");
      throw new Error("No image generated");
    }

    console.log("[generate-avatar] Successfully generated avatar");

    const base64Data = imagePart.inlineData!.data;
    const mimeType = imagePart.inlineData!.mimeType;

    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Avatar generation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 503 }
        );
      }
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "AI generation limit reached. Try again later." },
          { status: 429 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate avatar: ${errorMessage}` },
      { status: 500 }
    );
  }
}
