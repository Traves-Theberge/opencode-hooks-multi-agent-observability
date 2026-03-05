<script setup lang="ts">
import { computed, type Component } from 'vue';
import * as icons from 'lucide-vue-next';

const props = defineProps<{
  name: string;
  size?: number | string;
  strokeWidth?: number | string;
  class?: string;
}>();

const iconComponent = computed<Component | null>(() => {
  const icon = (icons as unknown as Record<string, Component>)[props.name];
  return icon || null;
});
</script>

<template>
  <component
    v-if="iconComponent"
    :is="iconComponent"
    :size="size || 16"
    :stroke-width="strokeWidth || 2"
    :class="$props.class"
  />
</template>
