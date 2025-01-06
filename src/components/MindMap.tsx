import React, { useState, useEffect, useRef } from 'react';
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
  isExpanded?: boolean;
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
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const generateGraph = async () => {
      if (!threadId || !assistantId) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Requesting mind map data...');
        const result = await generateMindMap(threadId, assistantId);
        console.log('Received mind map data:', result);

        const nodes = result.nodes.map(node => ({
          ...node,
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height
        }));
        console.log('Processing nodes:', nodes);

        const links = result.links.map(link => {
          const sourceNode = nodes.find(node => node.id === link.source);
          const targetNode = nodes.find(node => node.id === link.target);
          console.log('Processing link:', { link, sourceNode, targetNode });
          if (!sourceNode || !targetNode) return null;
          return {
            source: sourceNode,
            target: targetNode
          };
        }).filter((link): link is NonNullable<typeof link> => link !== null);

        console.log('Processed links:', links);

        const graphData = { nodes, links };
        console.log('Setting graph data:', graphData);
        setGraphData(graphData);

        // Initial force simulation configuration
        setTimeout(() => {
          if (graphRef.current) {
            console.log('Configuring force simulation...');
            graphRef.current.d3Force('link').distance(100);
            graphRef.current.d3Force('charge').strength(-300);
            graphRef.current.d3Force('center').strength(0.1);
            graphRef.current.d3ReheatSimulation();
            
            setTimeout(() => {
              console.log('Zooming to fit...');
              graphRef.current?.zoomToFit(400, 50);
            }, 500);
          }
        }, 100);
      } catch (err) {
        console.error('Mind map generation error:', err);
        setError('Failed to generate mind map. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    generateGraph();
  }, [threadId, assistantId, dimensions.width, dimensions.height]);

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
      <div ref={containerRef} className="mindmap-container h-[500px] border rounded-lg overflow-hidden relative">
        {graphData.nodes.length > 0 && dimensions.width > 0 && dimensions.height > 0 && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: Node) => {
              const val = node.val || 10;
              return val === 20 ? '#2563eb' : val === 15 ? '#3b82f6' : val === 12 ? '#60a5fa' : '#93c5fd';
            }}
            nodeRelSize={8}
            linkColor={() => '#94a3b8'}
            linkWidth={2}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            d3VelocityDecay={0.3}
            width={dimensions.width}
            height={dimensions.height}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            minZoom={0.5}
            maxZoom={4}
            cooldownTime={2000}
            cooldownTicks={50}
            warmupTicks={100}
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