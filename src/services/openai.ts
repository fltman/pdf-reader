import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: { "OpenAI-Beta": "assistants=v2" }
});

export const initializeAssistant = async (file: File) => {
  try {
    // First, upload the file
    const fileUpload = await openai.files.create({
      file,
      purpose: 'assistants'
    });

    // Create a vector store for file search
    const vectorStore = await openai.beta.vectorStores.create({
      name: "PDF Analysis Store"
    });

    // Add the file to the vector store
    await openai.beta.vectorStores.files.create(
      vectorStore.id,
      { file_id: fileUpload.id }
    );

    // Create an assistant with the specified model
    const assistant = await openai.beta.assistants.create({
      name: "PDF Reader Assistant",
      instructions: "You are a helpful assistant that analyzes PDF documents. You can provide summaries, generate keywords, and answer questions about the document.",
      model: "gpt-4o",
      tools: [
        { type: "code_interpreter" },
        { type: "file_search" }
      ],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });

    // Create a thread for this session
    const thread = await openai.beta.threads.create();

    // Add the initial message with the file
    await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: "Please analyze this PDF document.",
        attachments: [
          {
            file_id: fileUpload.id,
            tools: [{ type: "file_search" }]
          }
        ]
      }
    );

    return {
      assistantId: assistant.id,
      threadId: thread.id,
      vectorStoreId: vectorStore.id
    };
  } catch (error) {
    console.error('Error initializing assistant:', error);
    throw error;
  }
};

export const generateSummary = async (assistantId: string, threadId: string) => {
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: "Please provide a concise summary of the document."
    });

    return await pollRunCompletion(threadId, run.id);
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

const pollRunCompletion = async (threadId: string, runId: string): Promise<string> => {
  const maxAttempts = 60; // 1 minute timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    
    switch (run.status) {
      case 'completed': {
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[messages.data.length - 1];
        
        if (lastMessage.role === 'assistant') {
          if (typeof lastMessage.content === 'string') {
            return lastMessage.content;
          }
          if (Array.isArray(lastMessage.content) && lastMessage.content[0]?.type === 'text') {
            return lastMessage.content[0].text.value;
          }
        }
        throw new Error('Unexpected message format');
      }

      case 'failed':
      case 'cancelled':
      case 'expired':
        throw new Error(`Run ended with status: ${run.status}`);

      case 'requires_action':
        throw new Error('Function calls are not implemented');

      default:
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        break;
    }
  }

  throw new Error('Polling timed out');
};
