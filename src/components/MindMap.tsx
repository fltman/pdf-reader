import React, { useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { generateMindMap } from '../services/OpenAIService';

interface MindMapProps {
  threadId: string | null;
  assistantId: string | null;
}

interface Node {
  id: string;
  name: string;
  val: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface ForceGraphData {
  nodes: Node[];
  links: {
    source: Node;
    target: Node;
  }[];
}

const MindMap: React.FC<MindMapProps> = ({ threadId, assistantId }) => {
  const [graphData, setGraphData] = useState<ForceGraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.mindmap-container');
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const generateGraph = async () => {
      if (!threadId || !assistantId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await generateMindMap(threadId, assistantId);
        // Transform the data to ensure proper object references for links
        const nodes = result.nodes;
        const links = result.links.map(link => {
          const sourceNode = nodes.find(node => node.id === link.source);
          const targetNode = nodes.find(node => node.id === link.target);
          if (!sourceNode || !targetNode) return null;
          return {
            source: sourceNode,
            target: targetNode
          };
        }).filter((link): link is NonNullable<typeof link> => link !== null);

        setGraphData({ nodes, links });
      } catch (err) {
        setError('Failed to generate mind map. Please try again.');
        console.error('Mind map generation error:', err);
      } finally {
        setLoading(false);
      }
    };

    generateGraph();
  }, [threadId, assistantId]);

  const handleNodeClick = useCallback((node: Node) => {
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
    
    // Center the view on the clicked node
    const fg = document.querySelector('.force-graph');
    if (fg) {
      const d3Force = (fg as any).__data__;
      if (d3Force) {
        d3Force.centerAt(node.x, node.y, 1000);
        d3Force.zoom(2, 1000);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Mind Map</h2>
      <div className="mindmap-container h-[500px] border rounded-lg overflow-hidden">
        {graphData.nodes.length > 0 && (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: Node) => {
              const val = node.val || 10;
              return val === 20 ? '#2563eb' : val === 15 ? '#3b82f6' : '#60a5fa';
            }}
            nodeRelSize={8}
            linkColor={() => '#94a3b8'}
            linkWidth={2}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            d3VelocityDecay={0.3}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            nodeCanvasObject={(node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              const x = node.x ?? 0;
              const y = node.y ?? 0;

              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                x - bckgDimensions[0] / 2,
                y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(label, x, y);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MindMap; 