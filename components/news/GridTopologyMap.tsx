import React, { useState, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  Node as FlowNode,
  Edge as FlowEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { 
  Building, Factory, Activity, Sun, Globe, Cable, Cpu, Info, Droplet, Zap, HelpCircle, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon Map for clean visual identifiers
const ICON_MAP: Record<string, any> = {
  building: Building,
  factory: Factory,
  network: Activity,
  sun: Sun,
  globe: Globe,
  cable: Cable,
  cpu: Cpu,
  droplet: Droplet,
  zap: Zap,
};

// Simplified Custom Node Renderer
function CustomGridNode({ data }: { data: any }) {
  const Icon = ICON_MAP[data.icon] || HelpCircle;
  const isSelected = data.selected;
  
  return (
    <div 
      className={cn(
        "px-3.5 py-3 rounded-lg border bg-slate-900 border-slate-800 text-slate-100 shadow-md flex items-center gap-3 min-w-[200px] select-none transition-all duration-200",
        isSelected ? "ring-2 ring-primary border-primary shadow-lg scale-[1.02]" : "hover:border-slate-700"
      )}
      style={{ borderLeft: `4px solid ${data.nodeColor || '#64748b'}` }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-700 !border-slate-800" />
      <span className="absolute top-2 right-2 flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <div 
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${data.nodeColor || '#64748b'}15`, color: data.nodeColor || '#cbd5e1' }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[8px] text-slate-400 uppercase font-mono tracking-wider font-bold leading-none">{data.designation}</div>
        <div className="font-bold text-[11px] text-slate-200 truncate mt-0.5 leading-tight tracking-tight">{data.label}</div>
        {data.kpiValue !== undefined && (
          <div className="text-[10px] font-mono font-medium text-slate-400 mt-1 leading-none">{data.kpiValue} {data.kpiUnit}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-700 !border-slate-800" />
    </div>
  );
}

const nodeTypes = { gridNode: CustomGridNode };

export function GridTopologyMap({ dbNodes = [], dbEdges = [], activeData }: any) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    systemStats,
    generationData,
    gasProductionData,
    borderImportsData,
    regionalDemandData,
  } = activeData || {};

  const reactiveMetrics = useMemo(() => {
    return {
      totalGas: 2647,
      bibiyana: 928.7,
      rpgclLng: 1008,
      demandPeak: 16854.11,
      loadShedVal: 7.26,
      avgCostVal: 6.615,
      dailyCostVal: '227.1',
      cbImports: 2584,
      renewGen: 5.45,
      descoDemand: 3180,
      dpdcDemand: 3850,
      ruralDemand: 5800,
      westDemand: 850,
      nwDemand: 1100
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const defaultNodes = [
      { id: 'mpemr', label: 'Ministry of Power (MPEMR)', designation: 'Policy & Budget', category: 'government', icon: 'building', nodeColor: '#6366f1' },
      { id: 'berc', label: 'Energy Regulator (BERC)', designation: 'Regulatory Body', category: 'regulator', icon: 'cpu', nodeColor: '#10b981' },
      { id: 'petrobangla', label: 'Petrobangla', designation: 'Gas Authority', category: 'gas', icon: 'droplet', nodeColor: '#06b6d4' },
      { id: 'bibiyana', label: 'Bibiyana field', designation: 'Gas Production', category: 'gas', icon: 'droplet', nodeColor: '#0891b2' },
      { id: 'rpgcl', label: 'RPGCL (LNG Regas)', designation: 'LNG Terminals', category: 'gas', icon: 'globe', nodeColor: '#0284c7' },
      { id: 'bpdb', label: 'BPDB (Single Buyer)', designation: 'Offtaker & Buyer', category: 'state_generation', icon: 'factory', nodeColor: '#0d9488' },
      { id: 'india_imports', label: 'India Interconnectors', designation: 'CB Imports', category: 'imports', icon: 'globe', nodeColor: '#a855f7' },
      { id: 'sreda', label: 'SREDA', designation: 'Renewables', category: 'regulator', icon: 'sun', nodeColor: '#84cc16' },
      { id: 'pgcb', label: 'National Grid (PGCB)', designation: 'Transmission', category: 'transmission', icon: 'activity', nodeColor: '#3b82f6' },
      { id: 'desco', label: 'DESCO (Dhaka North)', designation: 'Distributor', category: 'distribution', icon: 'cable', nodeColor: '#f97316' },
      { id: 'dpdc', label: 'DPDC (Dhaka South)', designation: 'Distributor', category: 'distribution', icon: 'cable', nodeColor: '#f97316' },
      { id: 'breb', label: 'BREB (Rural Grid)', designation: 'Distributor', category: 'distribution', icon: 'cable', nodeColor: '#ea580c' },
    ];

    const defaultEdges = [
      { id: 'e-mpemr-berc', source: 'mpemr', target: 'berc', label: 'Policy' },
      { id: 'e-mpemr-bpdb', source: 'mpemr', target: 'bpdb', label: 'Mandate' },
      { id: 'e-petro-bibi', source: 'petrobangla', target: 'bibiyana', label: 'Allocations' },
      { id: 'e-petro-rpgcl', source: 'petrobangla', target: 'rpgcl', label: 'LNG' },
      { id: 'e-bibi-bpdb', source: 'bibiyana', target: 'bpdb', label: 'Gas flow' },
      { id: 'e-rpgcl-bpdb', source: 'rpgcl', target: 'bpdb', label: 'Regas' },
      { id: 'e-india-bpdb', source: 'india_imports', target: 'bpdb', label: 'Import' },
      { id: 'e-sreda-bpdb', source: 'sreda', target: 'bpdb', label: 'Clean PPA' },
      { id: 'e-bpdb-pgcb', source: 'bpdb', target: 'pgcb', label: 'Evacuate' },
      { id: 'e-pgcb-desco', source: 'pgcb', target: 'desco', label: 'Feed' },
      { id: 'e-pgcb-dpdc', source: 'pgcb', target: 'dpdc', label: 'Feed' },
      { id: 'e-pgcb-breb', source: 'pgcb', target: 'breb', label: 'Feed' },
    ];

    const initialNodes: FlowNode[] = defaultNodes.map(n => ({
      id: n.id,
      type: 'gridNode',
      position: { x: 0, y: 0 },
      data: { ...n, selected: selectedNodeId === n.id },
    }));

    const initialEdges: FlowEdge[] = defaultEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
      style: { stroke: '#3b82f6', strokeWidth: 1.5, opacity: 0.55 }
    }));

    // DAGRE Layout calculation inside useEffect
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 100 });

    initialNodes.forEach(node => {
      dagreGraph.setNode(node.id, { width: 250, height: 70 });
    });
    initialEdges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = initialNodes.map(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 250 / 2,
          y: nodeWithPosition.y - 70 / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [isMounted, selectedNodeId]); // Re-run if selection changes (though normally we'd update just the data)

  if (!isMounted) return null;

  return (
    <div className="flex-grow w-full h-[600px] relative z-10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        fitView
      >
        <Background color="#334155" style={{ opacity: 0.12 }} gap={16} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
