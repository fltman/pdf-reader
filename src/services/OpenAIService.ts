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
  console.log('Getting assistant response for run:', run.id);
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  console.log('Initial run status:', runStatus.status);

  while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log('Updated run status:', runStatus.status);
  }

  if (runStatus.status === 'completed') {
    console.log('Run completed, retrieving messages');
    const messages = await openai.beta.threads.messages.list(threadId);
    console.log('Messages received:', messages.data);
    const message = messages.data[0].content[0];
    if ('text' in message) {
      console.log('Found text message:', message.text.value);
      return message.text.value;
    }
    console.log('No text content found in message:', message);
  } else {
    console.log('Run did not complete successfully. Status:', runStatus.status);
  }
  return '';
};

const createThreadRun = async (threadId: string, assistantId: string, content: string): Promise<string> => {
  console.log('Creating message in thread:', threadId);
  const message = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content
  });
  console.log('Message created:', message);

  console.log('Creating run with assistant:', assistantId);
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });
  console.log('Run created:', run);

  return getAssistantResponse(threadId, assistantId, run);
};

export const generateSummary = async (threadId: string, assistantId: string): Promise<string> => {
  return threadQueue.add(threadId, () =>
    createThreadRun(threadId, assistantId, "Please provide a concise summary of the document.")
  ).then(response => response || 'Unable to generate summary');
};

export interface KeywordWithDefinition {
  keyword: string;
  definition: string;
}

export const extractKeywords = async (threadId: string, assistantId: string): Promise<KeywordWithDefinition[]> => {
  return threadQueue.add(threadId, () =>
    createThreadRun(
      threadId,
      assistantId,
      "Extract the most important keywords and key concepts from the document. Return ONLY a raw JSON array of objects with keywords and definitions. Each object must have exactly two fields: 'keyword' and 'definition'. The response must start with '[' and end with ']'. Do not include any other text, explanations, or formatting. Example of valid response: [{\"keyword\":\"artificial intelligence\",\"definition\":\"The simulation of human intelligence by machines\"},{\"keyword\":\"neural networks\",\"definition\":\"Computing systems inspired by biological neural networks\"}]"
    )
  ).then(response => {
    if (response) {
      try {
        // Remove any potential whitespace or newlines before parsing
        const cleanResponse = response.trim();
        const keywordData = JSON.parse(cleanResponse) as KeywordWithDefinition[];
        return keywordData.filter(item => item.keyword && item.definition);
      } catch (error) {
        console.error('Error parsing keywords response:', error);
        console.error('Raw response:', response);
        return [];
      }
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
  
  const prompt = `Create a detailed hierarchical mind map of the document's main concepts and their relationships. Follow these steps:

1. First, identify the main topic of the document - this will be the central node
2. Then, identify 4-6 key subtopics that branch directly from the main topic
3. For each subtopic, identify 3-4 specific concepts, details, or examples
4. Add 1-2 related points for each specific concept where relevant

Format the response as a JSON object exactly like this:
{
  "nodes": [
    { "id": "1", "name": "Main Topic", "val": 20 },
    { "id": "2", "name": "Key Subtopic 1", "val": 15 },
    { "id": "3", "name": "Specific Concept 1.1", "val": 12 },
    { "id": "4", "name": "Related Point 1.1.1", "val": 10 }
  ],
  "links": [
    { "source": "1", "target": "2" },
    { "source": "2", "target": "3" },
    { "source": "3", "target": "4" }
  ]
}

Requirements:
1. Use actual concepts from the document
2. Keep node names concise (max 4-5 words)
3. Use the following node sizes:
   - Main topic: val = 20
   - Key subtopics: val = 15
   - Specific concepts: val = 12
   - Related points: val = 10
4. Include at least 15-20 nodes total
5. Ensure all nodes are connected via links
6. Return ONLY the JSON object with no additional text`;

  console.log('Generating mind map with prompt:', prompt);

  return threadQueue.add(threadId, () =>
    createThreadRun(threadId, assistantId, prompt)
  ).then(response => {
    console.log('Raw response from OpenAI:', response);

    if (!response) {
      console.error('No response received from OpenAI');
      return defaultGraph;
    }

    try {
      // Remove any potential text before or after the JSON
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || '';
      console.log('Extracted JSON string:', jsonStr);
      
      if (!jsonStr) {
        console.error('No JSON structure found in response');
        return defaultGraph;
      }

      const data = JSON.parse(jsonStr) as MindMapData;
      console.log('Parsed mind map data:', data);
      
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

      console.log('Valid nodes:', validNodes);

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

      console.log('Valid links:', validLinks);

      if (validLinks.length === 0) {
        console.error('No valid links found in mind map data');
        return defaultGraph;
      }

      const finalGraph = {
        nodes: validNodes,
        links: validLinks
      };

      console.log('Final mind map structure:', finalGraph);
      return finalGraph;
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