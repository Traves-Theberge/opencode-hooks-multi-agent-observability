<template>
  <div class="w-full bg-card/40 backdrop-blur-md rounded-xl border border-border shadow-sm p-6 relative overflow-hidden" :class="className">
    <div class="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none"></div>
    
    <div class="flex items-center justify-between mb-4 relative z-10">
      <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
        <Network class="w-4 h-4 text-primary opacity-80" /> System Topology
      </h3>
      <div v-if="activeNode" class="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
        Active: {{ activeNode.label }}
      </div>
    </div>

    <div class="relative w-full flex items-center justify-center z-10 transition-all duration-500" :class="nodes.length > 0 ? 'h-[300px]' : 'h-[120px]'">
      <svg class="absolute inset-0 w-full h-full overflow-visible" aria-label="Agent Topology Graph">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="hsl(var(--accent-green))" stop-opacity="0.4" />
            <stop offset="100%" stop-color="hsl(var(--accent-green))" stop-opacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Edges -->
        <g class="edges">
          <path
            v-for="edge in edges"
            :key="`${edge.source}-${edge.target}`"
            :d="calculatePath(edge)"
            fill="none"
            :stroke="getEdgeColor(edge)"
            :stroke-width="edge.active ? 2.5 : 1"
            :stroke-dasharray="edge.active ? '5,5' : 'none'"
            :class="edge.active ? 'animate-dash bg-pulse' : 'opacity-40'"
            class="transition-all duration-300"
          />
        </g>
      </svg>

      <!-- Nodes (HTML-based for easier styling/layout over SVG) -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex flex-col items-center gap-2"
        :style="{ left: `${node.x}%`, top: `${node.y}%` }"
      >
        <div 
          class="relative group cursor-pointer"
          @mouseenter="hoveredNode = node.id"
          @mouseleave="hoveredNode = null"
        >
          <!-- Pulse animation for active nodes -->
          <div v-if="node.active" class="absolute inset-0 rounded-full animate-ping opacity-50" :style="{ backgroundColor: node.color }"></div>
          
          <!-- Node Circle -->
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform duration-300 relative z-10"
            :class="[
              node.active ? 'scale-110 ring-4 ring-primary/20' : 'scale-100',
              hoveredNode === node.id ? 'scale-110 shadow-xl' : ''
            ]"
            :style="{ 
              backgroundColor: `${node.color}20`,
              borderColor: node.color,
              boxShadow: node.active ? `0 0 20px ${node.color}60` : 'none'
            }"
          >
            <DynIcon :name="getAgentIcon(node.label)" class="w-5 h-5" />
          </div>

          <!-- Tooltip / Label -->
          <div 
            class="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-popover text-popover-foreground text-xs font-semibold rounded-md border border-border shadow-xl backdrop-blur-md whitespace-nowrap z-20 transition-opacity duration-200"
            :class="hoveredNode === node.id || node.active ? 'opacity-100' : 'opacity-70'"
          >
            {{ node.label }}
          </div>
          
          <!-- Activity Badge -->
          <div v-if="node.eventCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background z-20">
            {{ node.eventCount > 99 ? '99+' : node.eventCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Network } from 'lucide-vue-next';
import DynIcon from './DynIcon.vue';
import type { HookEvent } from '../types';
import { useEventColors } from '../composables/useEventColors';

const props = defineProps<{
  events: HookEvent[];
  className?: string;
}>();

const { getHexColorForApp } = useEventColors();

// Graph State
const hoveredNode = ref<string | null>(null);
const activeNodeId = ref<string | null>(null);

// Types for local graph rendering
interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  active: boolean;
  eventCount: number;
}

interface EdgeData {
  source: string;
  target: string;
  sourcePos: { x: number, y: number };
  targetPos: { x: number, y: number };
  active: boolean;
}

// Track recent activity to flash nodes
const recentActivityMap = ref<Record<string, number>>({});

watch(() => props.events, (newEvents) => {
  if (newEvents.length > 0) {
    const latestEvent = newEvents[newEvents.length - 1];
    const appId = latestEvent.source_app;
    
    // Set active node
    activeNodeId.value = appId;
    
    // Record activity timestamp for pulsing
    recentActivityMap.value[appId] = Date.now();
    
    // Clear active status after 2 seconds
    setTimeout(() => {
      if (recentActivityMap.value[appId] && Date.now() - recentActivityMap.value[appId] >= 1900) {
        if (activeNodeId.value === appId) {
          activeNodeId.value = null;
        }
      }
    }, 2000);
  }
}, { deep: true });

// Extract unique agents from events
const uniqueAgents = computed(() => {
  const agentMap = new Map<string, number>(); // Map of app_name to event count
  
  props.events.forEach(event => {
    const app = event.source_app;
    agentMap.set(app, (agentMap.get(app) || 0) + 1);
  });
  
  return Array.from(agentMap.entries()).map(([name, count]) => ({
    name,
    count
  }));
});

// Calculate radial layout for nodes
const nodes = computed<NodeData[]>(() => {
  const agents = uniqueAgents.value;
  if (agents.length === 0) return [];
  
  // Center node if only 1
  if (agents.length === 1) {
    return [{
      id: agents[0].name,
      label: agents[0].name,
      x: 50,
      y: 50,
      color: getHexColorForApp(agents[0].name),
      active: activeNodeId.value === agents[0].name,
      eventCount: agents[0].count
    }];
  }

  // Draw in a circle
  return agents.map((agent, index) => {
    const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2; // Start at top
    // 35% radius within the 50x50 center
    const radius = 35;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    
    return {
      id: agent.name,
      label: agent.name,
      x,
      y,
      color: getHexColorForApp(agent.name),
      active: activeNodeId.value === agent.name,
      eventCount: agent.count
    };
  });
});

const activeNode = computed(() => {
  if (!activeNodeId.value) return null;
  return nodes.value.find(n => n.id === activeNodeId.value) || null;
});

// Calculate edges based on recent communication (inferred from sequence)
// For a fully accurate topology, we'd need explicit source/target in events,
// but for now we link the chronologically consecutive agents to show flow.
const edges = computed<EdgeData[]>(() => {
  const eList: EdgeData[] = [];
  const nList = nodes.value;
  
  if (nList.length < 2 || props.events.length < 2) return eList;
  
  // Track connections we've built to avoid duplicates
  const connectionSet = new Set<string>();
  
  // Look at the last 50 events to build connections
  const recentEvents = props.events.slice(-50);
  
  for (let i = 1; i < recentEvents.length; i++) {
    const prev = recentEvents[i - 1].source_app;
    const curr = recentEvents[i].source_app;
    
    if (prev !== curr) {
      const edgeKey = `${prev}->${curr}`;
      const reverseKey = `${curr}->${prev}`;
      
      // Look up positions
      const sourceNode = nList.find(n => n.id === prev);
      const targetNode = nList.find(n => n.id === curr);
      
      if (sourceNode && targetNode && !connectionSet.has(edgeKey) && !connectionSet.has(reverseKey)) {
        connectionSet.add(edgeKey);
        
        // Active if this is the most recent transition
        const isActive = i === recentEvents.length - 1;
        
        eList.push({
          source: prev,
          target: curr,
          sourcePos: { x: sourceNode.x, y: sourceNode.y },
          targetPos: { x: targetNode.x, y: targetNode.y },
          active: isActive
        });
      }
    }
  }
  
  return eList;
});

// Calculate SVG path for edges (straight line between percentages)
const calculatePath = (edge: EdgeData) => {
  return `M ${edge.sourcePos.x}% ${edge.sourcePos.y}% L ${edge.targetPos.x}% ${edge.targetPos.y}%`;
};

const getEdgeColor = (edge: EdgeData) => {
  if (edge.active) {
    const targetNode = nodes.value.find(n => n.id === edge.target);
    return targetNode ? targetNode.color : 'hsl(var(--accent-green))';
  }
  return 'currentColor'; // Uses the text-muted-foreground via opacity inheritance
};

const getAgentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('research')) return 'Microscope';
  if (lower.includes('code') || lower.includes('dev')) return 'Terminal';
  if (lower.includes('review') || lower.includes('qa')) return 'Eye';
  if (lower.includes('write') || lower.includes('doc')) return 'FileEdit';
  if (lower.includes('plan')) return 'ClipboardList';
  if (lower.includes('search')) return 'Search';
  return 'Bot';
};
</script>

<style scoped>
@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}
.animate-dash {
  animation: dash 1s linear infinite;
}
.bg-grid-white\/5 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
}
</style>
