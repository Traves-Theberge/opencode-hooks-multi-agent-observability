<template>
  <div class="bg-card/60 backdrop-blur-md px-4 py-4 mobile:py-2 shadow-sm border-b border-border">
    <div class="flex items-center justify-between mb-3 mobile:mb-2">
      <div class="flex items-center gap-3 mobile:gap-2">
        <h3 class="text-base mobile:text-xs font-semibold text-foreground flex items-center">
          <BarChart3 class="w-5 h-5 mobile:w-4 mobile:h-4 text-primary mr-1.5 mobile:mr-1" />
          <span class="mobile:hidden">Live Activity Pulse</span>
        </h3>
        <div class="flex items-center gap-1.5 flex-wrap">
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20 shadow-sm"
            :title="`${uniqueAgentCount} active agent${uniqueAgentCount !== 1 ? 's' : ''}`"
          >
            <Users class="w-5 h-5 mobile:w-4 mobile:h-4 text-primary" />
            <span class="text-sm mobile:text-xs font-bold text-primary">{{ uniqueAgentCount }}</span>
            <span class="text-xs mobile:text-[10px] text-muted-foreground font-medium mobile:hidden">agents</span>
          </div>
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-lg border border-border shadow-sm"
            :title="`Total events in the last ${timeRange === '1m' ? '1 minute' : timeRange === '3m' ? '3 minutes' : timeRange === '5m' ? '5 minutes' : '10 minutes'}`"
          >
            <Zap class="w-5 h-5 mobile:w-4 mobile:h-4 text-accent-amber" />
            <span class="text-sm mobile:text-xs font-bold text-foreground">{{ totalEventCount }}</span>
            <span class="text-xs mobile:text-[10px] text-muted-foreground font-medium mobile:hidden">events</span>
          </div>
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-lg border border-border shadow-sm"
            :title="`Total tool calls in the last ${timeRange === '1m' ? '1 minute' : timeRange === '3m' ? '3 minutes' : timeRange === '5m' ? '5 minutes' : '10 minutes'}`"
          >
            <WrenchIcon class="w-5 h-5 mobile:w-4 mobile:h-4 text-muted-foreground" />
            <span class="text-sm mobile:text-xs font-bold text-foreground">{{ toolCallCount }}</span>
            <span class="text-xs mobile:text-[10px] text-muted-foreground font-medium mobile:hidden">tools</span>
          </div>
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-lg border border-border shadow-sm"
            :title="`Average time between events`"
          >
            <Clock class="w-5 h-5 mobile:w-4 mobile:h-4 text-muted-foreground" />
            <span class="text-sm mobile:text-xs font-bold text-foreground">{{ formatGap(eventTimingMetrics.avgGap) }}</span>
            <span class="text-xs mobile:text-[10px] text-muted-foreground font-medium mobile:hidden">avg gap</span>
          </div>
        </div>
      </div>
      <div class="flex gap-1.5 mobile:gap-1" role="tablist" aria-label="Time range selector">
        <button
          v-for="(range, index) in timeRanges"
          :key="range"
          @click="setTimeRange(range)"
          @keydown="handleTimeRangeKeyDown($event, index)"
          :class="[
            'px-3 py-1.5 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold rounded-lg transition-all duration-200 min-w-[30px] mobile:min-w-[24px] min-h-[30px] mobile:min-h-[24px] flex items-center justify-center shadow-sm border',
            timeRange === range
              ? 'bg-primary text-primary-foreground border-primary shadow-md'
              : 'bg-secondary text-foreground border-border hover:bg-accent hover:border-border-hover'
          ]"
          role="tab"
          :aria-selected="timeRange === range"
          :aria-label="`Show ${range === '1m' ? '1 minute' : range === '3m' ? '3 minutes' : range === '5m' ? '5 minutes' : '10 minutes'} of activity`"
          :tabindex="timeRange === range ? 0 : -1"
        >
          {{ range }}
        </button>
      </div>
    </div>
    <div ref="chartContainer" class="relative">
      <canvas
        ref="canvas"
        class="w-full cursor-crosshair"
        :style="{ height: chartHeight + 'px' }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        role="img"
        :aria-label="chartAriaLabel"
      ></canvas>
      <div
        v-if="tooltip.visible"
        class="absolute bg-popover text-popover-foreground px-3 py-2 rounded-lg text-xs pointer-events-none z-10 shadow-lg border border-border font-medium backdrop-blur-md"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        {{ tooltip.text }}
      </div>
      <div
        v-if="!hasData"
        class="absolute inset-0 flex items-center justify-center"
      >
        <p class="text-muted-foreground mobile:text-sm text-base font-medium flex items-center">
          <Loader2 class="w-4 h-4 animate-spin mr-1.5" />
          Waiting for events...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { BarChart3, Users, Zap, Wrench as WrenchIcon, Clock, Loader2 } from 'lucide-vue-next';
import type { HookEvent, TimeRange, ChartConfig } from '../types';
import { useChartData } from '../composables/useChartData';
import { createChartRenderer, type ChartDimensions } from '../utils/chartRenderer';
import { useEventEmojis } from '../composables/useEventEmojis';
import { useEventColors } from '../composables/useEventColors';

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
}>();

const emit = defineEmits<{
  updateUniqueApps: [appNames: string[]];
  updateAllApps: [appNames: string[]];
  updateTimeRange: [timeRange: TimeRange];
}>();

const canvas = ref<HTMLCanvasElement>();
const chartContainer = ref<HTMLDivElement>();
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 600);
const chartHeight = computed(() => windowHeight.value <= 400 ? 210 : 96);

const timeRanges: TimeRange[] = ['1m', '3m', '5m', '10m'];

const {
  timeRange,
  dataPoints,
  addEvent,
  getChartData,
  setTimeRange,
  cleanup: cleanupChartData,
  clearData,
  uniqueAgentCount,
  uniqueAgentIdsInWindow,
  allUniqueAgentIds,
  toolCallCount,
  eventTimingMetrics
} = useChartData();

// Format gap time in ms to readable string (e.g., "125ms" or "1.2s")
const formatGap = (gapMs: number): string => {
  if (gapMs === 0) return '—';
  if (gapMs < 1000) {
    return `${Math.round(gapMs)}ms`;
  }
  return `${(gapMs / 1000).toFixed(1)}s`;
};

// Watch uniqueAgentIdsInWindow and emit updates (for active agents in time window)
watch(uniqueAgentIdsInWindow, (agentIds) => {
  emit('updateUniqueApps', agentIds);
}, { immediate: true });

// Watch allUniqueAgentIds and emit updates (for all agents ever seen)
watch(allUniqueAgentIds, (agentIds) => {
  emit('updateAllApps', agentIds);
}, { immediate: true });

// Watch timeRange and emit updates
watch(timeRange, (range) => {
  emit('updateTimeRange', range);
}, { immediate: true });

let renderer: ReturnType<typeof createChartRenderer> | null = null;
let resizeObserver: ResizeObserver | null = null;
let animationFrame: number | null = null;
const processedEventIds = new Set<string>();

const { formatChartLabel } = useEventEmojis();
const { getHexColorForSession } = useEventColors();

const hasData = computed(() => dataPoints.value.some(dp => dp.count > 0));

const totalEventCount = computed(() => {
  return dataPoints.value.reduce((sum, dp) => sum + dp.count, 0);
});

const chartAriaLabel = computed(() => {
  const rangeText = timeRange.value === '1m' ? '1 minute' : timeRange.value === '3m' ? '3 minutes' : timeRange.value === '5m' ? '5 minutes' : '10 minutes';
  return `Activity chart showing ${totalEventCount.value} events over the last ${rangeText}`;
});

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  text: ''
});

const getTokenColor = (property: string): string => {
  const style = getComputedStyle(document.documentElement);
  const channels = style.getPropertyValue(`--${property}`).trim();
  return channels ? `hsl(${channels})` : '#3B82F6';
};

const getActiveConfig = (): ChartConfig => {
  return {
    maxDataPoints: 60,
    animationDuration: 300,
    barWidth: 3,
    barGap: 1,
    colors: {
      primary: getTokenColor('accent-green'),
      glow: getTokenColor('accent-green-muted'),
      axis: getTokenColor('border'),
      text: getTokenColor('muted-foreground')
    }
  };
};

const getDimensions = (): ChartDimensions => {
  const width = chartContainer.value?.offsetWidth || 800;
  return {
    width,
    height: chartHeight.value,
    padding: {
      top: 7,
      right: 7,
      bottom: 20,
      left: 7
    }
  };
};

const render = () => {
  if (!renderer || !canvas.value) return;

  const data = getChartData();
  const maxValue = Math.max(...data.map(d => d.count), 1);
  
  renderer.clear();
  renderer.drawBackground();
  renderer.drawAxes();
  renderer.drawTimeLabels(timeRange.value);
  renderer.drawBars(data, maxValue, 1, formatChartLabel, getHexColorForSession);
};

const animateNewEvent = (x: number, y: number) => {
  let radius = 0;
  let opacity = 0.8;
  
  const animate = () => {
    if (!renderer) return;
    
    render();
    renderer.drawPulseEffect(x, y, radius, opacity);
    
    radius += 2;
    opacity -= 0.02;
    
    if (opacity > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  };
  
  animate();
};

const handleWindowResize = () => {
  windowHeight.value = window.innerHeight;
};

const handleResize = () => {
  if (!renderer || !canvas.value) return;

  const dimensions = getDimensions();
  renderer.resize(dimensions);
  render();
};

const isEventFiltered = (event: HookEvent): boolean => {
  if (props.filters.sourceApp && event.source_app !== props.filters.sourceApp) {
    return false;
  }
  if (props.filters.sessionId && event.session_id !== props.filters.sessionId) {
    return false;
  }
  if (props.filters.eventType && event.hook_event_type !== props.filters.eventType) {
    return false;
  }
  return true;
};

const processNewEvents = () => {
  const currentEvents = props.events;
  const newEventsToProcess: HookEvent[] = [];
  
  // Find events that haven't been processed yet
  currentEvents.forEach(event => {
    const eventKey = `${event.id}-${event.timestamp}`;
    if (!processedEventIds.has(eventKey)) {
      processedEventIds.add(eventKey);
      newEventsToProcess.push(event);
    }
  });
  
  // Process new events
  newEventsToProcess.forEach(event => {
    if (event.hook_event_type !== 'refresh' && event.hook_event_type !== 'initial' && isEventFiltered(event)) {
      addEvent(event);
      
      // Trigger pulse animation for new event
      if (renderer && canvas.value) {
        const chartArea = getDimensions();
        const x = chartArea.width - chartArea.padding.right - 10;
        const y = chartArea.height / 2;
        animateNewEvent(x, y);
      }
    }
  });
  
  // Clean up old event IDs to prevent memory leak
  // Keep only IDs from current events
  const currentEventIds = new Set(currentEvents.map(e => `${e.id}-${e.timestamp}`));
  processedEventIds.forEach(id => {
    if (!currentEventIds.has(id)) {
      processedEventIds.delete(id);
    }
  });
  
  render();
};

// Watch for new events
watch(() => props.events, (newEvents) => {
  // If events array is empty, clear all internal state
  if (newEvents.length === 0) {
    clearData();
    processedEventIds.clear();
    render();
    return;
  }
  processNewEvents();
}, { deep: true });

// Watch for filter changes
watch(() => props.filters, () => {
  // Reset and reprocess all events with new filters
  dataPoints.value = [];
  processedEventIds.clear();
  processNewEvents();
}, { deep: true });

// Watch for time range changes
watch(timeRange, () => {
  // Need to re-process all events when time range changes
  // because bucket sizes are different
  render();
});

// Watch for chart height changes
watch(chartHeight, () => {
  handleResize();
});

const handleMouseMove = (event: MouseEvent) => {
  if (!canvas.value || !chartContainer.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const data = getChartData();
  const dimensions = getDimensions();
  const chartArea = {
    x: dimensions.padding.left,
    y: dimensions.padding.top,
    width: dimensions.width - dimensions.padding.left - dimensions.padding.right,
    height: dimensions.height - dimensions.padding.top - dimensions.padding.bottom
  };
  
  const barWidth = chartArea.width / data.length;
  const barIndex = Math.floor((x - chartArea.x) / barWidth);
  
  if (barIndex >= 0 && barIndex < data.length && y >= chartArea.y && y <= chartArea.y + chartArea.height) {
    const point = data[barIndex];
    if (point.count > 0) {
      const eventTypesText = Object.entries(point.eventTypes || {})
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      
      tooltip.value = {
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 30,
        text: `${point.count} events${eventTypesText ? ` (${eventTypesText})` : ''}`
      };
      return;
    }
  }
  
  tooltip.value.visible = false;
};

const handleMouseLeave = () => {
  tooltip.value.visible = false;
};

const handleTimeRangeKeyDown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex;
  
  switch (event.key) {
    case 'ArrowLeft':
      newIndex = Math.max(0, currentIndex - 1);
      break;
    case 'ArrowRight':
      newIndex = Math.min(timeRanges.length - 1, currentIndex + 1);
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = timeRanges.length - 1;
      break;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    event.preventDefault();
    setTimeRange(timeRanges[newIndex]);
    // Focus the new button
    const buttons = (event.currentTarget as HTMLElement)?.parentElement?.querySelectorAll('button');
    if (buttons && buttons[newIndex]) {
      (buttons[newIndex] as HTMLButtonElement).focus();
    }
  }
};

// Watch for theme changes
const themeObserver = new MutationObserver(() => {
  if (renderer) {
    render();
  }
});

onMounted(() => {
  if (!canvas.value || !chartContainer.value) return;

  const dimensions = getDimensions();
  const config = getActiveConfig();

  renderer = createChartRenderer(canvas.value, dimensions, config);

  // Set up resize observer
  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(chartContainer.value);

  // Observe theme changes
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Listen for window height changes
  window.addEventListener('resize', handleWindowResize);
  
  // Initial render
  render();
  
  // Start optimized render loop with FPS limiting
  let lastRenderTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  
  const renderLoop = (currentTime: number) => {
    const deltaTime = currentTime - lastRenderTime;
    
    if (deltaTime >= frameInterval) {
      render();
      lastRenderTime = currentTime - (deltaTime % frameInterval);
    }
    
    requestAnimationFrame(renderLoop);
  };
  requestAnimationFrame(renderLoop);
});

onUnmounted(() => {
  cleanupChartData();

  if (renderer) {
    renderer.stopAnimation();
  }

  if (resizeObserver && chartContainer.value) {
    resizeObserver.disconnect();
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  themeObserver.disconnect();

  // Remove window resize listener
  window.removeEventListener('resize', handleWindowResize);
});
</script>