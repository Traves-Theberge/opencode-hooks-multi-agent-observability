<template>
  <button
    @click="$emit('toggle')"
    class="fixed bottom-6 right-6 mobile:bottom-4 mobile:right-4 group z-40"
    :title="stickToBottom ? 'Disable auto-scroll' : 'Scroll to latest'"
  >
    <div
      :class="[
        'relative p-3 rounded-xl transition-all duration-300 ease-out',
        'backdrop-blur-md shadow-lg border',
        'min-w-[48px] min-h-[48px] flex items-center justify-center',
        stickToBottom
          ? 'bg-accent-green/20 border-accent-green/40 shadow-[0_0_20px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] group-hover:bg-accent-green/30'
          : 'bg-card/80 border-border group-hover:border-border-hover group-hover:bg-card'
      ]"
    >
      <!-- Pulse ring when active -->
      <div
        v-if="stickToBottom"
        class="absolute inset-0 rounded-xl border border-accent-green/30 animate-ping"
        style="animation-duration: 2s;"
      ></div>

      <svg
        :class="[
          'w-5 h-5 transition-all duration-300',
          stickToBottom
            ? 'text-accent-green drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]'
            : 'text-muted-foreground group-hover:text-foreground'
        ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  stickToBottom: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>