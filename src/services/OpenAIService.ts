import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Queue system for managing thread runs
class ThreadQueue {
  private queue: { resolve: (value: string) => void; reject: (error: any) => void; action: () => Promise<string> }[] = [];
  private isProcessing = false;
  private activeRuns: { [threadId: string]: string } = {};

  async add(threadId: string, action: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, action });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { resolve, reject, action } = this.queue.shift()!;

    try {
      const result = await action();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}

const threadQueue = new ThreadQueue();

const getAssistantResponse = async (threadId: string, assistantId: string, run: any): Promise<string> => {
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (runStatus.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(threadId);
    const message = messages.data[0].content[0];
    if ('text' in message) {
      return message.text.value;
    }
  }
  return '';
};

const createThreadRun = async (threadId: string, assistantId: string, content: string): Promise<string> => {
  const message = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content
  });

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });

  return getAssistantResponse(threadId, assistantId, run);
};

export const generateSummary = async (threadId: string, assistantId: string): Promise<string> => {
  return threadQueue.add(threadId, () =>
    createThreadRun(threadId, assistantId, "Please provide a concise summary of the document.")
  ).then(response => response || 'Unable to generate summary');
};

export const extractKeywords = async (threadId: string, assistantId: string): Promise<string[]> => {
  return threadQueue.add(threadId, () =>
    createThreadRun(
      threadId,
      assistantId,
      "Extract the most important keywords and key concepts from the document. Return them as a comma-separated list. Each keyword or key phrase should be 1-3 words maximum. Do not include full sentences or explanations. For example: 'artificial intelligence, neural networks, machine learning' not 'The document discusses artificial intelligence and its applications.'"
    )
  ).then(response => {
    if (response) {
      const keywords = response.split(',');
      return keywords.map((keyword: string) => keyword.trim()).filter(keyword => keyword.length > 0);
    }
    return [];
  });
};

interface MindMapNode {
  id: string;
  name: string;
  val: number;
}

interface MindMapLink {
  source: string;
  target: string;
}

interface MindMapData {
  nodes: MindMapNode[];
  links: MindMapLink[];
}

export const generateMindMap = async (threadId: string, assistantId: string): Promise<MindMapData> => {
  const defaultGraph: MindMapData = { nodes: [], links: [] };
  
  return threadQueue.add(threadId, () =>
    createThreadRun(
      threadId,
      assistantId,
      `Create a hierarchical mind map of the document's main concepts. Follow these steps:

1. First, identify the main topic of the document - this will be the central node
2. Then, identify 3-5 key subtopics that branch directly from the main topic
3. For each subtopic, identify 2-3 related concepts

Format the response as a JSON object exactly like this:
{
  "nodes": [
    { "id": "1", "name": "Document's Main Topic", "val": 20 },
    { "id": "2", "name": "Key Subtopic 1", "val": 15 },
    { "id": "3", "name": "Key Subtopic 2", "val": 15 },
    { "id": "4", "name": "Related Concept 1.1", "val": 10 },
    { "id": "5", "name": "Related Concept 1.2", "val": 10 }
  ],
  "links": [
    { "source": "1", "target": "2" },
    { "source": "1", "target": "3" },
    { "source": "2", "target": "4" },
    { "source": "2", "target": "5" }
  ]
}

Requirements:
1. Use actual concepts from the document, not placeholder text
2. Main topic node should have id "1" and val 20
3. Subtopic nodes should have val 15
4. Related concept nodes should have val 10
5. All node IDs must be strings
6. Include at least 8 nodes total
7. Ensure all nodes are connected via links
8. Return ONLY the JSON object with no additional text or explanation`
    )
  ).then(response => {
    if (!response) return defaultGraph;

    try {
      // Remove any potential text before or after the JSON
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '';
      if (!jsonStr) return defaultGraph;

      const data = JSON.parse(jsonStr) as MindMapData;
      
      // Validate the structure
      if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
        console.error('Invalid mind map structure: missing nodes or links arrays');
        return defaultGraph;
      }

      // Validate and fix nodes
      const validNodes = data.nodes.filter((node: MindMapNode) => 
        node && typeof node.id === 'string' && 
        typeof node.name === 'string' && 
        typeof node.val === 'number'
      );

      if (validNodes.length === 0) {
        console.error('No valid nodes found in mind map data');
        return defaultGraph;
      }

      // Validate and fix links
      const validLinks = data.links.filter((link: MindMapLink) =>
        link && typeof link.source === 'string' && 
        typeof link.target === 'string' &&
        validNodes.some((n: MindMapNode) => n.id === link.source) &&
        validNodes.some((n: MindMapNode) => n.id === link.target)
      );

      if (validLinks.length === 0) {
        console.error('No valid links found in mind map data');
        return defaultGraph;
      }

      const result = {
        nodes: validNodes,
        links: validLinks
      };

      // Log the final structure for debugging
      console.log('Mind map structure:', result);

      return result;
    } catch (error) {
      console.error('Error parsing mind map JSON:', error);
      return defaultGraph;
    }
  });
};

export const chatWithAI = async (threadId: string, assistantId: string, userMessage: string): Promise<string> => {
  return threadQueue.add(threadId, () =>
    createThreadRun(threadId, assistantId, userMessage)
  ).then(response => response || 'No response generated');
}; 