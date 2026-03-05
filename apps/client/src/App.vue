<template>
  <div class="h-screen flex flex-col bg-background text-foreground font-sans">
    <!-- Header with Premium Glassmorphism -->
    <header class="short:hidden bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div class="px-4 py-3 flex items-center justify-between gap-4">
        <!-- Title Section -->
        <div>
          <h1 class="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
            Multi-Agent Observability
          </h1>
        </div>

        <!-- Connection Status & Tools -->
        <div class="flex items-center gap-3">
          <div v-if="isConnected" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-success/10 border border-status-success/20">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
            </span>
            <span class="text-xs font-medium text-status-success">Connected</span>
          </div>
          <div v-else class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-error/10 border border-status-error/20">
            <span class="relative flex h-2 w-2">
              <span class="relative inline-flex rounded-full h-2 w-2 bg-status-error"></span>
            </span>
            <span class="text-xs font-medium text-status-error">Disconnected</span>
          </div>

          <!-- Event Count Tag -->
          <span class="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
            {{ events.length }} Events
          </span>

          <div class="h-4 w-px bg-border mx-1"></div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1">
            <button
              @click="handleClearClick"
              class="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Clear events"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>

            <button
              @click="showFilters = !showFilters"
              class="p-2 rounded-md transition-colors"
              :class="showFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'"
              :title="showFilters ? 'Hide filters' : 'Show filters'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Filters -->
    <FilterPanel
      v-if="showFilters"
      class="short:hidden"
      :filters="filters"
      @update:filters="filters = $event"
    />
    
    <!-- Live Pulse Chart -->
    <LivePulseChart
      :events="events"
      :filters="filters"
      @update-unique-apps="uniqueAppNames = $event"
      @update-all-apps="allAppNames = $event"
      @update-time-range="currentTimeRange = $event"
    />

    <!-- Agent Swim Lane Container (below pulse chart, full width, hidden when empty) -->
    <div v-if="selectedAgentLanes.length > 0" class="w-full bg-card/60 backdrop-blur-md px-3 py-4 mobile:px-2 mobile:py-2 overflow-hidden border-b border-border">
      <AgentSwimLaneContainer
        :selected-agents="selectedAgentLanes"
        :events="events"
        :time-range="currentTimeRange"
        @update:selected-agents="selectedAgentLanes = $event"
      />
    </div>
    
    <!-- Dashboard Main View (Tabbed: Topology / Event Stream) -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Tab Bar -->
      <div class="flex items-center bg-card/60 backdrop-blur-md border-b border-border px-4 py-0 gap-1 shrink-0">
        <button
          @click="activeTab = 'events'"
          class="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200"
          :class="activeTab === 'events' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'"
        >
          <Zap class="w-4 h-4" :class="activeTab === 'events' ? 'text-accent-amber' : ''" />
          Event Stream
          <span v-if="events.length > 0" class="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{{ events.length }}</span>
          <span
            v-if="activeTab === 'events'"
            class="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
          />
        </button>
        <button
          @click="activeTab = 'topology'"
          class="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200"
          :class="activeTab === 'topology' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'"
        >
          <Network class="w-4 h-4" :class="activeTab === 'topology' ? 'text-primary' : ''" />
          Topology
          <span
            v-if="activeTab === 'topology'"
            class="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
          />
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-hidden">
        <!-- Events Tab -->
        <EventTimeline
          v-show="activeTab === 'events'"
          class="h-full bg-card/40 backdrop-blur-md"
          :events="events"
          :filters="filters"
          :unique-app-names="uniqueAppNames"
          :all-app-names="allAppNames"
          v-model:stick-to-bottom="stickToBottom"
          @select-agent="toggleAgentLane"
        />

        <!-- Topology Tab -->
        <div v-show="activeTab === 'topology'" class="h-full overflow-auto p-3">
          <TopologyView
            :events="events"
            class="h-full"
          />
        </div>
      </div>
    </div>
    
    <!-- Stick to bottom button -->
    <StickScrollButton
      class="short:hidden"
      :stick-to-bottom="stickToBottom"
      @toggle="stickToBottom = !stickToBottom"
    />
    
    <div
      v-if="error"
      class="fixed bottom-4 left-4 mobile:bottom-3 mobile:left-3 mobile:right-3 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2.5 rounded-lg backdrop-blur-md shadow-lg text-sm font-medium"
    >
      {{ error }}
    </div>
    
    <!-- Theme Manager -->
    <ThemeManager
      :is-open="showThemeManager"
      @close="showThemeManager = false"
    />

    <!-- Toast Notifications -->
    <ToastNotification
      v-for="(toast, index) in toasts"
      :key="toast.id"
      :index="index"
      :agent-name="toast.agentName"
      :agent-color="toast.agentColor"
      @dismiss="dismissToast(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Zap, Network } from 'lucide-vue-next';
import type { TimeRange } from './types';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import { useEventColors } from './composables/useEventColors';
import EventTimeline from './components/EventTimeline.vue';
import FilterPanel from './components/FilterPanel.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import LivePulseChart from './components/LivePulseChart.vue';
import ThemeManager from './components/ThemeManager.vue';
import ToastNotification from './components/ToastNotification.vue';
import AgentSwimLaneContainer from './components/AgentSwimLaneContainer.vue';
import TopologyView from './components/TopologyView.vue';
import { WS_URL } from './config';

// WebSocket connection
const { events, isConnected, error, clearEvents } = useWebSocket(WS_URL);
const activeTab = ref<'events' | 'topology'>('events');

// Theme management (sets up theme system)
useThemes();

// Event colors
const { getHexColorForApp } = useEventColors();

// Filters
const filters = ref({
  sourceApp: '',
  sessionId: '',
  eventType: ''
});

// UI state
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showFilters = ref(false);
const uniqueAppNames = ref<string[]>([]); // Apps active in current time window
const allAppNames = ref<string[]>([]); // All apps ever seen in session
const selectedAgentLanes = ref<string[]>([]);
const currentTimeRange = ref<TimeRange>('1m'); // Current time range from LivePulseChart

// Toast notifications
interface Toast {
  id: number;
  agentName: string;
  agentColor: string;
}
const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;
const seenAgents = new Set<string>();

// Watch for new agents and show toast
watch(uniqueAppNames, (newAppNames) => {
  // Find agents that are new (not in seenAgents set)
  newAppNames.forEach(appName => {
    if (!seenAgents.has(appName)) {
      seenAgents.add(appName);
      // Show toast for new agent
      const toast: Toast = {
        id: toastIdCounter++,
        agentName: appName,
        agentColor: getHexColorForApp(appName)
      };
      toasts.value.push(toast);
    }
  });
}, { deep: true });

const dismissToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

// Handle agent tag clicks for swim lanes
const toggleAgentLane = (agentName: string) => {
  const index = selectedAgentLanes.value.indexOf(agentName);
  if (index >= 0) {
    // Remove from comparison
    selectedAgentLanes.value.splice(index, 1);
  } else {
    // Add to comparison
    selectedAgentLanes.value.push(agentName);
  }
};

// Handle clear button click
const handleClearClick = () => {
  clearEvents();
  selectedAgentLanes.value = [];
};

</script>