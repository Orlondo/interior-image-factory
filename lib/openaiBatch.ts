type BatchRequestCounts = {
  total?: number;
  completed?: number;
  failed?: number;
};

type BatchMetadata = Record<string, string>;

export type OpenAIBatch = {
  id: string;
  status: string;
  output_file_id?: string | null;
  request_counts?: BatchRequestCounts;
  metadata?: BatchMetadata;
};

type OpenAIFileUploadResponse = {
  id: string;
};

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not set") as Error & {
      status?: number;
    };
    error.status = 500;
    throw error;
  }

  return apiKey;
}

async function openAIJson<T>(
  endpoint: string,
  init: RequestInit,
  apiKey: string
): Promise<T> {
  const response = await fetch(`https://api.openai.com${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    let message = `OpenAI request failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };

      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      if (text) {
        message = text.slice(0, 300);
      }
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return JSON.parse(text) as T;
}

export async function submitImageBatchJob(input: {
  prompts: string[];
  model: string;
  quality: "low" | "medium" | "high";
  size: `${number}x${number}` | "1024x1024" | "1536x1024" | "1024x1536";
  metadata?: BatchMetadata;
}): Promise<OpenAIBatch> {
  const apiKey = getOpenAIApiKey();

  const lines = input.prompts.map((prompt, index) =>
    JSON.stringify({
      custom_id: `img-${index}`,
      method: "POST",
      url: "/v1/images/generations",
      body: {
        model: input.model,
        prompt,
        quality: input.quality,
        size: input.size,
      },
    })
  );

  const jsonl = `${lines.join("\n")}\n`;

  const uploadForm = new FormData();
  uploadForm.set("purpose", "batch");
  uploadForm.set(
    "file",
    new Blob([jsonl], { type: "application/jsonl" }),
    `image-batch-${Date.now()}.jsonl`
  );

  const uploaded = await openAIJson<OpenAIFileUploadResponse>(
    "/v1/files",
    {
      method: "POST",
      body: uploadForm,
    },
    apiKey
  );

  const batch = await openAIJson<OpenAIBatch>(
    "/v1/batches",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_file_id: uploaded.id,
        endpoint: "/v1/images/generations",
        completion_window: "24h",
        metadata: input.metadata,
      }),
    },
    apiKey
  );

  return batch;
}

export async function fetchBatchStatus(batchId: string): Promise<OpenAIBatch> {
  const apiKey = getOpenAIApiKey();

  return openAIJson<OpenAIBatch>(
    `/v1/batches/${encodeURIComponent(batchId)}`,
    {
      method: "GET",
    },
    apiKey
  );
}

export async function cancelBatchJob(batchId: string): Promise<OpenAIBatch> {
  const apiKey = getOpenAIApiKey();

  return openAIJson<OpenAIBatch>(
    `/v1/batches/${encodeURIComponent(batchId)}/cancel`,
    {
      method: "POST",
    },
    apiKey
  );
}

export async function fetchFileContent(fileId: string): Promise<string> {
  const apiKey = getOpenAIApiKey();

  const response = await fetch(
    `https://api.openai.com/v1/files/${encodeURIComponent(fileId)}/content`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const text = await response.text();

  if (!response.ok) {
    let message = `OpenAI request failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };

      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      if (text) {
        message = text.slice(0, 300);
      }
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return text;
}
