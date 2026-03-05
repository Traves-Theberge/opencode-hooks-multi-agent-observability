<template>
  <div class="bg-card/60 backdrop-blur-md border-b border-border px-4 py-4 mobile:py-2 shadow-sm">
    <div class="flex flex-wrap gap-3 items-center mobile:flex-col mobile:items-stretch">
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-sm mobile:text-xs font-semibold text-foreground mb-1.5">
          Source App
        </label>
        <select
          v-model="localFilters.sourceApp"
          @change="updateFilters"
          class="w-full px-3 py-2 mobile:px-2 mobile:py-1.5 text-sm mobile:text-xs border border-border rounded-lg focus:ring-2 focus:ring-ring/30 focus:border-ring bg-input text-foreground shadow-sm hover:border-border-hover transition-all duration-200"
        >
          <option value="">All Sources</option>
          <option v-for="app in filterOptions.source_apps" :key="app" :value="app">
            {{ app }}
          </option>
        </select>
      </div>
      
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-sm mobile:text-xs font-semibold text-foreground mb-1.5">
          Session ID
        </label>
        <select
          v-model="localFilters.sessionId"
          @change="updateFilters"
          class="w-full px-3 py-2 mobile:px-2 mobile:py-1.5 text-sm mobile:text-xs border border-border rounded-lg focus:ring-2 focus:ring-ring/30 focus:border-ring bg-input text-foreground shadow-sm hover:border-border-hover transition-all duration-200"
        >
          <option value="">All Sessions</option>
          <option v-for="session in filterOptions.session_ids" :key="session" :value="session">
            {{ session.slice(0, 8) }}...
          </option>
        </select>
      </div>
      
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-sm mobile:text-xs font-semibold text-foreground mb-1.5">
          Event Type
        </label>
        <select
          v-model="localFilters.eventType"
          @change="updateFilters"
          class="w-full px-3 py-2 mobile:px-2 mobile:py-1.5 text-sm mobile:text-xs border border-border rounded-lg focus:ring-2 focus:ring-ring/30 focus:border-ring bg-input text-foreground shadow-sm hover:border-border-hover transition-all duration-200"
        >
          <option value="">All Types</option>
          <option v-for="type in filterOptions.hook_event_types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-4 py-2 mobile:px-2 mobile:py-1.5 mobile:w-full text-sm mobile:text-xs font-medium text-foreground bg-secondary hover:bg-accent rounded-lg border border-border hover:border-border-hover transition-all duration-200"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FilterOptions } from '../types';
import { API_BASE_URL } from '../config';

const props = defineProps<{
  filters: {
    sourceApp: string;
    sessionId: string;
    eventType: string;
  };
}>();

const emit = defineEmits<{
  'update:filters': [filters: typeof props.filters];
}>();

const filterOptions = ref<FilterOptions>({
  source_apps: [],
  session_ids: [],
  hook_event_types: []
});

const localFilters = ref({ ...props.filters });

const hasActiveFilters = computed(() => {
  return localFilters.value.sourceApp || localFilters.value.sessionId || localFilters.value.eventType;
});

const updateFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    sourceApp: '',
    sessionId: '',
    eventType: ''
  };
  updateFilters();
};

const fetchFilterOptions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/filter-options`);
    if (response.ok) {
      filterOptions.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
  }
};

onMounted(() => {
  fetchFilterOptions();
  // Refresh filter options periodically
  setInterval(fetchFilterOptions, 10000);
});
</script>