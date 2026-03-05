<template>
  <div class="flex-1 mobile:h-[50vh] overflow-hidden flex flex-col relative bg-background/50">
    <!-- Fixed Header -->
    <div class="px-4 py-4 mobile:py-3 bg-card/60 backdrop-blur-md border-b border-border relative z-10 shadow-sm">
      <h2 class="text-lg mobile:text-base font-semibold text-foreground tracking-tight flex items-center justify-center gap-2">
        <Zap class="w-5 h-5 text-accent-amber" /> Agent Event Stream
      </h2>

      <!-- Agent/App Tags Row -->
      <div v-if="displayedAgentIds.length > 0" class="mt-4 flex flex-wrap gap-2 justify-center">
        <button
          v-for="agentId in displayedAgentIds"
          :key="agentId"
          @click="emit('selectAgent', agentId)"
          :class="[
            'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center gap-1.5 group',
            isAgentActive(agentId)
              ? 'text-foreground bg-secondary/80 border-border hover:border-border-hover hover:-translate-y-0.5'
              : 'text-muted-foreground bg-muted/30 border-border/50 hover:bg-muted/50 hover:text-foreground/80'
          ]"
          :style="{
             borderColor: isAgentActive(agentId) ? getHexColorForApp(getAppNameFromAgentId(agentId)) : '',
          }"
          :title="`${isAgentActive(agentId) ? 'Active: Click to remove' : 'Sleeping: Click to add'} ${agentId} to comparison lanes`"
        >
          <component :is="isAgentActive(agentId) ? Sparkles : MoonStar" class="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
          <span class="font-mono">{{ agentId }}</span>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mt-4 w-full max-w-3xl mx-auto">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            :value="searchPattern"
            @input="updateSearchPattern(($event.target as HTMLInputElement).value)"
            placeholder="Search events (regex)... e.g., 'tool.*error' or '^GET'"
            :class="[
              'w-full pl-9 pr-10 py-2 rounded-lg text-sm font-mono border transition-all duration-200 shadow-sm',
              'bg-input/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60',
              'border-border hover:border-border-hover focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background focus:bg-input',
              searchError ? 'border-destructive focus:ring-destructive/30' : ''
            ]"
            aria-label="Search events"
          />
          <button
            v-if="searchPattern"
            @click="clearSearch"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-md transition-colors duration-200"
            title="Clear search"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div
          v-if="searchError"
          class="mt-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"
        >
          <AlertTriangle class="w-3.5 h-3.5" /> {{ searchError }}
        </div>
      </div>
    </div>
    
    <!-- Scrollable Event List -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto px-4 py-4 mobile:px-2 mobile:py-2 relative custom-scrollbar"
      @scroll="handleScroll"
    >
      <TransitionGroup
        name="event"
        tag="div"
        class="space-y-3 mobile:space-y-2 max-w-5xl mx-auto"
      >
        <EventRow
          v-for="event in filteredEvents"
          :key="`${event.id}-${event.timestamp}`"
          :event="event"
          :gradient-class="getGradientForSession(event.session_id)"
          :color-class="getColorForSession(event.session_id)"
          :app-gradient-class="getGradientForApp(event.source_app)"
          :app-color-class="getColorForApp(event.source_app)"
          :app-hex-color="getHexColorForApp(event.source_app)"
        />
      </TransitionGroup>
      
      <div v-if="filteredEvents.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[300px]">
        <div class="w-16 h-16 mb-4 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
          <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <p class="text-sm font-medium text-foreground/80 mb-1">No events to display</p>
        <p class="text-xs">Events will appear here as they are received.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Zap, Sparkles, MoonStar, AlertTriangle } from 'lucide-vue-next';
import type { HookEvent } from '../types';
import EventRow from './EventRow.vue';
import { useEventColors } from '../composables/useEventColors';
import { useEventSearch } from '../composables/useEventSearch';

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
  stickToBottom: boolean;
  uniqueAppNames?: string[]; // Agent IDs (app:session) active in current time window
  allAppNames?: string[]; // All agent IDs (app:session) ever seen in session
}>();

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean];
  selectAgent: [agentName: string];
}>();

const scrollContainer = ref<HTMLElement>();
const { getGradientForSession, getColorForSession, getGradientForApp, getColorForApp, getHexColorForApp } = useEventColors();
const { searchPattern, searchError, searchEvents, updateSearchPattern, clearSearch } = useEventSearch();

// Use all agent IDs, preferring allAppNames if available (all ever seen), fallback to uniqueAppNames (active in time window)
const displayedAgentIds = computed(() => {
  return props.allAppNames?.length ? props.allAppNames : (props.uniqueAppNames || []);
});

// Extract app name from agent ID (format: "app:session")
const getAppNameFromAgentId = (agentId: string): string => {
  return agentId.split(':')[0];
};

// Check if an agent is currently active (has events in the current time window)
const isAgentActive = (agentId: string): boolean => {
  return (props.uniqueAppNames || []).includes(agentId);
};

const filteredEvents = computed(() => {
  let filtered = props.events.filter(event => {
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
  });

  // Apply regex search filter
  if (searchPattern.value) {
    filtered = searchEvents(filtered, searchPattern.value);
  }

  return filtered;
});

const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

const handleScroll = () => {
  if (!scrollContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
  
  if (isAtBottom !== props.stickToBottom) {
    emit('update:stickToBottom', isAtBottom);
  }
};

watch(() => props.events.length, async () => {
  if (props.stickToBottom) {
    await nextTick();
    scrollToBottom();
  }
});

watch(() => props.stickToBottom, (shouldStick) => {
  if (shouldStick) {
    scrollToBottom();
  }
});
</script>

<style scoped>
.event-enter-active {
  transition: all 0.3s ease;
}

.event-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.event-leave-active {
  transition: all 0.3s ease;
}

.event-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>