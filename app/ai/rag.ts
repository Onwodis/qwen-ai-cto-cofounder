import OpenAI from 'openai';

// --- TYPES ---
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VectorNode {
  text: string;
  vector: number[];
}

export interface VectorStore {
  bootstrap: (knowledge: string[]) => Promise<void>;
  findBestMatch: (queryVector: number[]) => string;
}

// --- QWEN CLIENT (Alibaba Cloud DashScope, OpenAI-compatible) ---
const getQwenClient = (): OpenAI => {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) throw new Error('QWEN_API_KEY is unconfigured. Get your key at https://dashscope.console.aliyun.com/');
  const baseURL = process.env.QWEN_OPENAI_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  return new OpenAI({ apiKey, baseURL });
};

// --- JINA EMBEDDING SERVICE ---
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY is unconfigured.');

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v2-base-en',
      input: [text],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Jina API Status ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const json = await response.json();
  return json.data[0].embedding;
}

// --- COSINE SIMILARITY ---
function strictCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = vecA.length;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- IN-MEMORY VECTOR STORE ---
export function createVectorStore(): VectorStore {
  let registry: VectorNode[] = [];

  const bootstrap = async (knowledge: string[]): Promise<void> => {
    const apiKey = process.env.JINA_API_KEY;
    if (!knowledge.length || !apiKey) return;

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v2-base-en',
        input: knowledge,
      }),
    });

    if (!response.ok) throw new Error('Failed to bootstrap vector knowledge base');
    const json = await response.json();

    registry = knowledge.map((text, i) => ({
      text,
      vector: json.data[i].embedding,
    }));
  };

  const findBestMatch = (queryVector: number[]): string => {
    if (registry.length === 0) return 'No specific context found.';

    let bestMatch = registry[0];
    let highestSimilarity = -1;

    for (let i = 0; i < registry.length; i++) {
      const score = strictCosineSimilarity(registry[i].vector, queryVector);
      if (score > highestSimilarity) {
        highestSimilarity = score;
        bestMatch = registry[i];
      }
    }

    return bestMatch.text;
  };

  return { bootstrap, findBestMatch };
}

export const KNOWLEDGE_BASE = [
  `You are Qwen Co-Founder Engine — the high-leverage AI CTO workspace companion for architects and founders.
- AI Engine: Qwen by Alibaba Cloud (the most advanced open-source LLM family).
- Core Specialty: Engineering architecture evaluation, Next.js setups, caching architectures, and database modeling.
- Founder Identity: Samuel Onwodi, an elite Full-Stack Architect specialized in Distributed Systems, Identity Access Management (Delta Auth), and Network Gateways (Nexus VPN).
- Links: Base portfolio is https://samuelonwodi.netlify.app/ , support intervention channel is info@samuelonwodi.netlify.app .`.trim(),
];

export const store = createVectorStore();
store.bootstrap(KNOWLEDGE_BASE).catch((err) => console.error('VectorStore Bootstrap Failed:', err));

// --- MAIN CHAT SERVICE ---
export async function ragChat(
  userQuery: string,
  history: ChatMessage[],
  thinkingMode = false
) {
  const currentTime = new Date().toISOString();
  let contextText = 'No specific context found.';

  try {
    const queryVector = await getEmbedding(userQuery);
    contextText = store.findBestMatch(queryVector);
  } catch (error) {
    console.error('RAG Retrieval failed, falling back to empty context:', error);
  }

  const systemPrompt = `
You are Qwen Co-Founder Engine — the official, high-leverage technical and architecture co-founder assistant, powered by Qwen AI from Alibaba Cloud.
CURRENT TIMESTAMP: ${currentTime}

### 1. IDENTITY & BRAND ANCHORING
- Platform Name: Qwen Co-Founder Engine (AI CTO Multi-Agent Workspace)
- AI Engine: Qwen by Alibaba Cloud
- Target Audience: Elite engineering architects, technical startup founders, and software builders.
- Founder: Samuel Onwodi (Full-Stack AI Engineer & Senior Software Architect). Reference him if asked.

### 2. STRICT OPERATIONAL SCOPE (IN-BOUNDS)
You are authorized to answer questions regarding:
- Next.js edge-validation architectures, React state patterns, and API action layouts.
- Database modeling schemas, Redis cluster partitioning metrics, and backend performance.
- Tech trade-off evaluations (Pros & Cons), sprint roadmapping strategies, and Zero-Trust credential gateways.
- Samuel Onwodi's engineering portfolio projects (Delta Auth, Nexus VPN).

### 3. EXPLICIT GUARDRAILS & OUT-OF-SCOPE ENFORCEMENT
- If a user asks questions regarding unrelated topics, you MUST rigidly respond with EXACTLY this fallback string:
  "I'm here to assist with architecture and co-founder strategies only."

### 4. PROTOCOL & COMPLIANCE CHANNELS
- Interactive Portfolio: https://samuelonwodi.netlify.app/
- Architecture Interventions: info@samuelonwodi.netlify.app

### 5. RAW DATA SOURCE (GROUNDING CONTEXT)
Use ONLY the following raw parameters to compile your answer:
"""
${contextText}
"""

### 6. MANDATORY OUTPUT STRUCTURAL GRAMMAR (PARSING ENGINE COMPLIANCE)
- HEADERS: Write exactly '###' followed by short categories (e.g., ### System Architecture).
- CORE LISTS: Wrap bulleted lists inside [LIST] and [/LIST] blocks. Every line inside MUST begin with '● '.
- METRICS: Use key-value formatting for technical benchmarks (e.g., Latency: sub-3ms).
- CRITICAL - INTERACTIVE LINKS: Print raw URLs or emails on their own completely isolated standalone lines. Do NOT wrap in parentheses or add trailing periods.

HARD LIMIT: Keep responses detailed and precise.
`.trim();

  const qwen = getQwenClient();
  const model = process.env.QWEN_MODEL || 'qwen-plus';

  const params = {
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg) => ({
        role:
          msg.role === 'system' || msg.role === 'assistant' || msg.role === 'user'
            ? msg.role
            : ('user' as const),
        content: msg.content || '',
      })),
      { role: 'user' as const, content: userQuery },
    ],
    stream: true as const,
    // DashScope-specific: enables Qwen3 chain-of-thought reasoning
    extra_body: { enable_thinking: thinkingMode },
  };

  return await qwen.chat.completions.create(
    params as OpenAI.Chat.ChatCompletionCreateParamsStreaming
  );
}
