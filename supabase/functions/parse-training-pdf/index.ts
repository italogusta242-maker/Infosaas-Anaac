import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No PDF file provided");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = encode(new Uint8Array(arrayBuffer));

    const systemPrompt = `Você é um assistente especializado em extrair informações de documentos PDF (Planilhas de Treino, Cardápios, Planners).
Sua tarefa é ler o documento e extrair os blocos de conteúdo principais como uma lista de itens estruturados.

REGRAS:
1. Identifique os blocos lógicos (ex: Treino A, Treino B, Segunda-feira, Café da Manhã, Almoço, etc.).
2. Para cada bloco, extraia o título e o conteúdo detalhado (lista de exercícios, alimentos, ou metas).
3. Seja fiel aos nomes e detalhes presentes no documento.

Responda APENAS com JSON válido:
{
  "title": "Título Geral do Documento",
  "items": [
    {
      "title": "Título do Bloco (ex: Treino A)",
      "content": "Conteúdo detalhado aqui em formato de texto. Liste os exercícios/alimentos e suas especificações.",
      "subtitle": "Informação extra curta (ex: 'Perna' ou '08:00')"
    }
  ]
}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64,
                  },
                },
                { text: "Extraia o conteúdo deste PDF seguindo o formato JSON solicitado." }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${errText}`);
    }
    
    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("IA returned empty response");

    const planData = JSON.parse(resultText);

    return new Response(JSON.stringify({ plan: planData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[PARSE-PDF-ERROR]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
