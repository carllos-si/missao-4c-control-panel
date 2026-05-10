import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { BEHAVIORAL_SYSTEM_PROMPT } from "@/lib/ai-prompt";
import type { Participant } from "@/types/database";

export const maxDuration = 120;

type Attempt = {
  modelName: string;
  apiVersion: "v1" | "v1beta";
};

function getErrorText(error: unknown): string {
  return error instanceof Error ? error.message : "Erro ao chamar Gemini";
}

function isQuotaError(error: unknown): boolean {
  const message = getErrorText(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("too many requests")
  );
}

function isModelNotFoundError(error: unknown): boolean {
  const message = getErrorText(error).toLowerCase();
  return message.includes("404") && message.includes("not found");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no servidor" },
      { status: 500 }
    );
  }

  let body: {
    companyName: string;
    appliedAt?: string;
    participants: Participant[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { companyName, appliedAt, participants } = body;
  if (!companyName || !Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const payload = {
    empresa: companyName,
    data_aplicacao: appliedAt ?? new Date().toISOString(),
    participantes: participants.map((p) => ({
      nome: p.name,
      observacoes: p.observations || "(sem observações registradas)",
    })),
  };

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const preferredModel = configuredModel || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(key);

  const userPrompt = `${BEHAVIORAL_SYSTEM_PROMPT}

Gere o laudo executivo com base neste JSON:

${JSON.stringify(payload, null, 2)}`;

  const attempts: Attempt[] = [{ modelName: preferredModel, apiVersion: "v1" }];
  if (preferredModel !== "gemini-2.0-flash") {
    attempts.push({ modelName: "gemini-2.0-flash", apiVersion: "v1" });
  }
  attempts.push({ modelName: preferredModel, apiVersion: "v1beta" });
  if (preferredModel !== "gemini-2.0-flash") {
    attempts.push({ modelName: "gemini-2.0-flash", apiVersion: "v1beta" });
  }

  let lastError: unknown;
  const attempted: Attempt[] = [];

  for (const attempt of attempts) {
    attempted.push(attempt);
    try {
      const model = genAI.getGenerativeModel(
        { model: attempt.modelName },
        { apiVersion: attempt.apiVersion }
      );
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      if (!text?.trim()) {
        return NextResponse.json({ error: "Resposta vazia do modelo" }, { status: 502 });
      }
      return NextResponse.json({
        report: text,
        modelUsed: attempt.modelName,
        apiVersionUsed: attempt.apiVersion,
      });
    } catch (e) {
      lastError = e;

      // Evita chamadas extras: quota/parâmetro inválido devem interromper imediatamente.
      if (isQuotaError(e)) {
        return NextResponse.json(
          {
            error:
              "Limite de uso da API Gemini excedido para a chave/projeto atual (quota 429). " +
              "A geração foi bloqueada temporariamente pela Google.",
            action:
              "No Google AI Studio/Cloud, habilite billing e confirme quotas do projeto/chave ativa; " +
              "alternativamente aguarde o reset da janela de rate-limit.",
            debug: {
              configuredModel: configuredModel ?? null,
              preferredModel,
              attempted,
              providerMessage: getErrorText(e),
            },
          },
          { status: 429 }
        );
      }

      // Só tenta próximo fallback quando for erro de modelo não encontrado.
      if (!isModelNotFoundError(e)) {
        break;
      }
    }
  }

  try {
    if (lastError instanceof Error) {
      return NextResponse.json(
        {
          error:
            `${lastError.message}. ` +
            "Defina GEMINI_MODEL para um modelo disponível no seu projeto (ex.: gemini-2.0-flash) " +
            "ou confirme se a chave tem permissão/quota para gerar conteúdo.",
          debug: {
            configuredModel: configuredModel ?? null,
            preferredModel,
            attempted,
          },
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao chamar Gemini. Verifique modelo e versão de API." },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado ao processar falha da IA." },
      { status: 502 }
    );
  }
}
