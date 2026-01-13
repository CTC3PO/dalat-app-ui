import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ContentLocale,
  CONTENT_LOCALES,
  TranslationContentType,
  TranslationFieldName,
} from "@/lib/types";

interface TranslateRequest {
  content_type: TranslationContentType;
  content_id: string;
  fields: {
    field_name: TranslationFieldName;
    text: string;
  }[];
  detect_language?: boolean;
}

interface TranslationResult {
  detected_locale: ContentLocale;
  translations: Record<ContentLocale, Record<string, string>>;
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator for a community events platform in Da Lat, Vietnam.
Your job is to translate content into multiple languages while:
- Preserving the original meaning, tone, and energy
- Keeping proper nouns (place names, brand names, people's names) intact
- Maintaining any formatting (line breaks, lists, emojis)
- Being culturally appropriate for each target locale
- Keeping content natural and fluent in each language

IMPORTANT: Return ONLY valid JSON, no explanations or markdown.`;

function buildTranslationPrompt(
  fields: { field_name: string; text: string }[],
  targetLocales: ContentLocale[]
): string {
  const fieldsText = fields
    .map((f) => `${f.field_name}: """${f.text}"""`)
    .join("\n\n");

  const localeList = targetLocales.join(", ");
  const fieldNames = fields.map((f) => `"${f.field_name}": "translated text"`).join(", ");

  return `Detect the source language and translate the following content to these languages: ${localeList}

Content to translate:
${fieldsText}

Return JSON in this exact format (no markdown, no explanations):
{
  "detected_locale": "xx",
  "translations": {
    "en": { ${fieldNames} },
    "vi": { ${fieldNames} },
    "ko": { ${fieldNames} },
    "zh": { ${fieldNames} },
    "ru": { ${fieldNames} },
    "fr": { ${fieldNames} },
    "ja": { ${fieldNames} },
    "ms": { ${fieldNames} },
    "th": { ${fieldNames} },
    "de": { ${fieldNames} },
    "es": { ${fieldNames} },
    "id": { ${fieldNames} }
  }
}

detected_locale should be one of: en, vi, ko, zh, ru, fr, ja, ms, th, de, es, id
If the source language is not in the list, use the closest match or "en".`;
}

/**
 * POST /api/translate
 * Translates content to all 12 supported languages using Claude
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check - translations require authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body: TranslateRequest = await request.json();

    // Validation
    if (!body.content_type || !body.content_id) {
      return NextResponse.json(
        { error: "content_type and content_id are required" },
        { status: 400 }
      );
    }

    if (!body.fields || body.fields.length === 0) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    // Filter out empty fields
    const fieldsToTranslate = body.fields.filter(
      (f) => f.text && f.text.trim().length > 0
    );

    if (fieldsToTranslate.length === 0) {
      return NextResponse.json(
        { error: "No non-empty fields to translate" },
        { status: 400 }
      );
    }

    // Call Claude for translation
    const client = new Anthropic();

    const prompt = buildTranslationPrompt(fieldsToTranslate, CONTENT_LOCALES);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: TRANSLATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    let result: TranslationResult;
    try {
      // Clean up the response - remove any markdown code blocks
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      result = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse translation response:", textContent.text);
      throw new Error("Invalid translation response format");
    }

    // Validate detected locale
    const detectedLocale = CONTENT_LOCALES.includes(result.detected_locale as ContentLocale)
      ? result.detected_locale
      : "en";

    // Update source_locale on the content
    if (body.content_type === "event") {
      await supabase
        .from("events")
        .update({ source_locale: detectedLocale })
        .eq("id", body.content_id);
    } else if (body.content_type === "moment") {
      await supabase
        .from("moments")
        .update({ source_locale: detectedLocale })
        .eq("id", body.content_id);
    } else if (body.content_type === "profile") {
      await supabase
        .from("profiles")
        .update({ bio_source_locale: detectedLocale })
        .eq("id", body.content_id);
    }

    // Prepare translation inserts
    const translationInserts: {
      content_type: string;
      content_id: string;
      source_locale: string;
      target_locale: string;
      field_name: string;
      translated_text: string;
      translation_status: string;
    }[] = [];

    for (const locale of CONTENT_LOCALES) {
      const localeTranslations = result.translations[locale];
      if (!localeTranslations) continue;

      for (const field of fieldsToTranslate) {
        const translatedText = localeTranslations[field.field_name];
        if (!translatedText) continue;

        translationInserts.push({
          content_type: body.content_type,
          content_id: body.content_id,
          source_locale: detectedLocale,
          target_locale: locale,
          field_name: field.field_name,
          translated_text: translatedText,
          translation_status: "auto",
        });
      }
    }

    // Upsert translations (update if exists, insert if not)
    if (translationInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("content_translations")
        .upsert(translationInserts, {
          onConflict: "content_type,content_id,target_locale,field_name",
        });

      if (insertError) {
        console.error("Translation insert error:", insertError);
        // Don't fail the request - translations might still be useful to return
      }
    }

    return NextResponse.json({
      success: true,
      source_locale: detectedLocale,
      translations_count: translationInserts.length,
      translations: result.translations,
    });
  } catch (error) {
    console.error("Translation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 503 }
        );
      }
      if (error.message.includes("rate") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "AI service busy. Try again in a moment." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to translate content" },
      { status: 500 }
    );
  }
}
