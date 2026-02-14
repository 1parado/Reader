import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// AI provider types
type AIProvider = 'openai' | 'ollama';

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// Default configurations
const DEFAULT_OPENAI_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OLLAMA_URL = "http://localhost:11434/v1";
const DEFAULT_OLLAMA_MODEL = "llama3.2";

export async function POST(req: Request) {
  const body = await req.json();
  const { text, sectionId } = body;

  console.log(`Generating quiz for section ${sectionId}...`);

  // Parse AI configuration from headers
  const provider: AIProvider = (req.headers.get('x-ai-provider') as AIProvider) || 'openai';
  const apiKey = req.headers.get('x-openai-key') || process.env.OPENAI_API_KEY || '';
  const baseUrl = req.headers.get('x-openai-url') || process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_URL;
  const model = req.headers.get('x-ai-model') || undefined;

  // Build AI config based on provider
  const config: AIConfig = buildAIConfig(provider, apiKey, baseUrl, model);

  // For OpenAI provider, require API key
  if (config.provider === 'openai' && !config.apiKey) {
    console.log('No API key provided, using mock data');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return NextResponse.json(getMockQuiz(sectionId));
  }

  // For Ollama provider, no API key needed
  if (config.provider === 'ollama') {
    console.log(`Using Ollama at ${config.baseUrl} with model ${config.model}`);
  }

  const openai = new OpenAI({
    apiKey: config.apiKey || 'ollama', // Ollama doesn't need a real key, but SDK requires something
    baseURL: config.baseUrl,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: config.model || DEFAULT_OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful tutor. Generate a single multiple-choice question based on the provided text to test comprehension. Return ONLY a valid JSON object with the following structure: { question: string, options: string[], correctOptionIndex: number, explanation: string }."
        },
        {
          role: "user",
          content: `Text: "${text}"`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from AI");
    
    const quizData = JSON.parse(content);
    return NextResponse.json(quizData);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(getMockQuiz(sectionId)); // Fallback on error
  }
}

/**
 * Build AI configuration based on provider type
 */
function buildAIConfig(
  provider: AIProvider, 
  apiKey: string, 
  baseUrl: string, 
  model?: string
): AIConfig {
  if (provider === 'ollama') {
    return {
      provider: 'ollama',
      apiKey: '', // Ollama doesn't need API key
      baseUrl: baseUrl || DEFAULT_OLLAMA_URL,
      model: model || DEFAULT_OLLAMA_MODEL,
    };
  }

  // Default to OpenAI
  return {
    provider: 'openai',
    apiKey: apiKey,
    baseUrl: baseUrl || DEFAULT_OPENAI_URL,
    model: model || DEFAULT_OPENAI_MODEL,
  };
}

function getMockQuiz(sectionId: string) {
  if (sectionId === 'section_1') {
    return {
      question: "Why is the Socratic method compared to 'midwifery' (maieutics)?",
      options: [
        "Because Socrates' mother was a midwife.",
        "Because it helps give birth to ideas implicit in the mind.",
        "Because it is a painful process.",
      ],
      correctOptionIndex: 1,
      explanation: "Socrates believed he didn't teach new knowledge, but rather helped others bring out (give birth to) the knowledge they already possessed."
    };
  } else if (sectionId === 'section_2') {
    return {
      question: "What is the primary mechanism of the Socratic method described here?",
      options: [
        "Hypothesis elimination through identifying contradictions.",
        "Memorization of facts.",
        "Listening to a lecture.",
      ],
      correctOptionIndex: 0,
      explanation: "The text states it is a method of hypothesis elimination, where better hypotheses are found by eliminating those that lead to contradictions."
    };
  } else {
    return {
      question: "What is the main idea of this paragraph?",
      options: [
        "To explain the history of the concept.",
        "To define the core logic.",
        "To provide examples.",
      ],
      correctOptionIndex: 1,
      explanation: "The paragraph focuses on defining the underlying logic and methodology."
    };
  }
}
