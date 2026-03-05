<template>
  <div>
    <!-- HITL Question Section (NEW) -->
    <div
      v-if="event.humanInTheLoop && (event.humanInTheLoopStatus?.status === 'pending' || hasSubmittedResponse)"
      class="mb-4 p-4 rounded-lg border-2 shadow-lg"
      :class="hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded' ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' : 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 animate-pulse-slow'"
      @click.stop
    >
      <!-- Question Header -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <component :is="hitlTypeIcon" class="w-8 h-8 text-current" />
            <h3 class="text-lg font-bold" :class="hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded' ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'">
              {{ hitlTypeLabel }}
            </h3>
            <span v-if="permissionType" class="text-xs font-mono font-semibold px-2 py-1 rounded border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100">
              {{ permissionType }}
            </span>
          </div>
          <span v-if="!hasSubmittedResponse && event.humanInTheLoopStatus?.status !== 'responded'" class="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
            <Clock class="w-3 h-3 inline-block mr-1 pb-0.5" /> Waiting for response...
          </span>
        </div>
        <div class="flex items-center space-x-2 ml-9">
          <span
            class="text-xs font-semibold text-foreground px-1.5 py-0.5 rounded-full border-2 bg-secondary shadow-sm"
            :style="{ ...appBgStyle, ...appBorderStyle }"
          >
            {{ event.source_app }}
          </span>
          <span class="text-xs text-card-foreground px-1.5 py-0.5 rounded-full border bg-secondary/50 shadow-sm" :class="borderColorClass">
            {{ sessionIdShort }}
          </span>
          <span class="text-xs text-muted-foreground font-medium">
            {{ formatTime(event.timestamp) }}
          </span>
        </div>
      </div>

      <!-- Question Text -->
      <div class="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border" :class="hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded' ? 'border-green-300' : 'border-yellow-300'">
        <p class="text-base font-medium text-gray-900 dark:text-gray-100">
          {{ event.humanInTheLoop.question }}
        </p>
      </div>

      <!-- Inline Response Display (Optimistic UI) -->
      <div v-if="localResponse || (event.humanInTheLoopStatus?.status === 'responded' && event.humanInTheLoopStatus.response)" class="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-400">
        <div class="flex items-center mb-2">
          <CheckCircle class="w-5 h-5 mr-2 text-green-500 inline-block" />
          <strong class="text-green-900 dark:text-green-100">Your Response:</strong>
        </div>
        <div v-if="(localResponse?.response || event.humanInTheLoopStatus?.response?.response)" class="text-gray-900 dark:text-gray-100 ml-7">
          {{ localResponse?.response || event.humanInTheLoopStatus?.response?.response }}
        </div>
        <div v-if="(localResponse?.permission !== undefined || event.humanInTheLoopStatus?.response?.permission !== undefined)" class="text-gray-900 dark:text-gray-100 ml-7">
          {{ (localResponse?.permission ?? event.humanInTheLoopStatus?.response?.permission) ? 'Approved <CheckCircle class="w-4 h-4 inline-block ml-1 text-green-500" />' : 'Denied <XCircle class="w-4 h-4 inline-block ml-1 text-red-500" />' }}
        </div>
        <div v-if="(localResponse?.choice || event.humanInTheLoopStatus?.response?.choice)" class="text-gray-900 dark:text-gray-100 ml-7">
          {{ localResponse?.choice || event.humanInTheLoopStatus?.response?.choice }}
        </div>
      </div>

      <!-- Response UI -->
      <div v-if="event.humanInTheLoop.type === 'question'">
        <!-- Text Input for Questions -->
        <textarea
          v-model="responseText"
          class="w-full p-3 border-2 border-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          rows="3"
          placeholder="Type your response here..."
          @click.stop
        ></textarea>
        <div class="flex justify-end space-x-2 mt-2">
          <button
            @click.stop="submitResponse"
            :disabled="!responseText.trim() || isSubmitting || hasSubmittedResponse"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '<Clock class="w-4 h-4 inline-block mr-1 animate-spin" /> Sending...' : '<CheckCircle class="w-4 h-4 inline-block mr-1" /> Submit Response' }}
          </button>
        </div>
      </div>

      <div v-else-if="event.humanInTheLoop.type === 'permission'">
        <!-- Yes/No Buttons for Permissions -->
        <div class="flex justify-end items-center space-x-3">
          <div v-if="hasSubmittedResponse || event.humanInTheLoopStatus?.status === 'responded'" class="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-500">
            <span class="text-sm font-bold text-green-900 dark:text-green-100">Responded</span>
          </div>
          <button
            @click.stop="submitPermission(false)"
            :disabled="isSubmitting || hasSubmittedResponse"
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            :class="hasSubmittedResponse ? 'opacity-40 cursor-not-allowed' : ''"
          >
            <template v-if="isSubmitting"><Loader2 class="w-4 h-4 inline-block mr-1 animate-spin" /></template>
            <template v-else><XCircle class="w-4 h-4 inline-block mr-1" /> Deny</template>
          </button>
          <button
            @click.stop="submitPermission(true)"
            :disabled="isSubmitting || hasSubmittedResponse"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            :class="hasSubmittedResponse ? 'opacity-40 cursor-not-allowed' : ''"
          >
            <template v-if="isSubmitting"><Loader2 class="w-4 h-4 inline-block mr-1 animate-spin" /></template>
            <template v-else><CheckCircle class="w-4 h-4 inline-block mr-1" /> Approve</template>
          </button>
        </div>
      </div>

      <div v-else-if="event.humanInTheLoop.type === 'choice'">
        <!-- Multiple Choice Buttons -->
        <div class="flex flex-wrap gap-2 justify-end">
          <button
            v-for="choice in event.humanInTheLoop.choices"
            :key="choice"
            @click.stop="submitChoice(choice)"
            :disabled="isSubmitting || hasSubmittedResponse"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
          >
            {{ isSubmitting ? "<Clock class='w-4 h-4 inline-block mr-1 animate-spin' />" : choice }}
          </button>
        </div>
      </div>
    </div>

    <!-- Original Event Row Content (skip if HITL with humanInTheLoop) -->
    <div
      v-if="!event.humanInTheLoop"
      class="group relative p-5 mobile:p-3 rounded-xl transition-all duration-300 cursor-pointer border border-border/50 hover:border-border bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md"
      :class="{ 'ring-1 ring-ring/50 border-border bg-card/60 shadow-lg': isExpanded }"
      @click="toggleExpanded"
    >
    <!-- App color indicator -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-2 rounded-l-xl opacity-80 group-hover:opacity-100 transition-opacity"
      :style="{ backgroundColor: appHexColor }"
    ></div>
    
    <!-- Session color indicator -->
    <div 
      class="absolute left-2 top-0 bottom-0 w-1 opacity-50"
      :class="gradientClass"
    ></div>
    
    <div class="ml-5">
      <!-- Desktop Layout: Original horizontal layout -->
      <div class="hidden mobile:block mb-3">
        <!-- Mobile: App + Time on first row -->
        <div class="flex items-center justify-between mb-2">
          <span 
            class="text-xs font-semibold px-2 py-0.5 rounded-md border border-border/50 shadow-sm"
            :style="{ ...appBgStyle, color: appHexColor }"
          >
            {{ event.source_app }}
          </span>
          <span class="text-xs text-muted-foreground font-medium">
            {{ formatTime(event.timestamp) }}
          </span>
        </div>
        
        <!-- Mobile: Session + Event Type on second row -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/50 border border-border/50">
            {{ sessionIdShort }}
          </span>
          <span v-if="event.model_name" class="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/50 border border-border/50 shadow-sm" :title="`Model: ${event.model_name}`">
            <Brain class="w-3.5 h-3.5 inline-block mr-1 opacity-70" />{{ formatModelName(event.model_name) }}
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <component :is="hookIcon" class="w-4 h-4 mr-1.5 inline-block" />
            {{ event.hook_event_type }}
          </span>
          <span v-if="toolName" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-accent/30 text-accent-foreground bg-accent/10 shadow-sm">
            <component :is="toolIcon" class="w-3.5 h-3.5 mr-1 inline-block" />{{ toolName }}
          </span>
        </div>
      </div>

      <!-- Desktop Layout: Original single row layout -->
      <div class="flex items-center justify-between mb-3 mobile:hidden">
        <div class="flex items-center gap-3">
          <span
            class="text-sm font-semibold px-2.5 py-1 rounded-md border border-border/50 shadow-sm"
            :style="{ ...appBgStyle, color: appHexColor }"
          >
            {{ event.source_app }}
          </span>
          <span class="text-xs text-muted-foreground px-2.5 py-1 rounded-md bg-secondary/30 border border-border/50 shadow-sm">
            {{ sessionIdShort }}
          </span>
          <span v-if="event.model_name" class="text-xs text-muted-foreground px-2.5 py-1 rounded-md bg-secondary/30 border border-border/50 shadow-sm" :title="`Model: ${event.model_name}`">
            <Brain class="w-4 h-4 inline-block mr-1.5 opacity-70" />{{ formatModelName(event.model_name) }}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <component :is="hookIcon" class="w-5 h-5 mr-1.5 inline-block" />
            {{ event.hook_event_type }}
          </span>
          <span v-if="toolName" class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border border-accent/30 text-accent-foreground bg-accent/10 shadow-sm">
            <component :is="toolIcon" class="w-4 h-4 mr-1.5 inline-block" />{{ toolName }}
          </span>
        </div>
        <span class="text-xs text-muted-foreground font-medium bg-muted/30 px-2 py-1 rounded-md border border-border/30">
          {{ formatTime(event.timestamp) }}
        </span>
      </div>
      
      <!-- Tool info and Summary - Desktop Layout -->
      <div class="flex items-center justify-between mb-1 mobile:hidden">
        <div v-if="toolInfo" class="text-sm text-foreground font-medium flex items-center gap-2">
          <span class="font-mono text-xs px-2 py-0.5 rounded-md border border-accent/20 bg-accent/5 text-accent-foreground shadow-sm">{{ toolInfo.tool }}</span>
          <span v-if="toolInfo.detail" class="text-muted-foreground" :class="{ 'italic text-foreground/80': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
        </div>
        
        <!-- Summary aligned to the right -->
        <div v-if="event.summary" class="max-w-[50%] px-3 py-1.5 bg-secondary/40 border border-border/50 rounded-lg shadow-sm backdrop-blur-sm">
          <span class="text-sm text-foreground/90 font-medium flex items-center gap-1.5">
            <FileText class="w-4 h-4 inline-block opacity-70" />
            {{ event.summary }}
          </span>
        </div>
      </div>

      <!-- Tool info and Summary - Mobile Layout -->
      <div class="space-y-3 hidden mobile:block mb-1">
        <div v-if="toolInfo" class="text-sm text-foreground font-medium w-full flex flex-col gap-1.5">
          <span class="font-mono text-xs px-2 py-0.5 w-fit rounded-md border border-accent/20 bg-accent/5 text-accent-foreground shadow-sm">{{ toolInfo.tool }}</span>
          <span v-if="toolInfo.detail" class="text-muted-foreground text-xs" :class="{ 'italic text-foreground/80': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
        </div>
        
        <div v-if="event.summary" class="w-full px-3 py-2 bg-secondary/40 border border-border/50 rounded-lg shadow-sm backdrop-blur-sm">
          <span class="text-xs text-foreground/90 font-medium flex items-center gap-1.5">
            <FileText class="w-3.5 h-3.5 inline-block opacity-70" />
            {{ event.summary }}
          </span>
        </div>
      </div>
      
      <!-- Expanded content -->
      <div v-if="isExpanded" class="mt-4 pt-4 border-t border-border/50 space-y-4">
        <!-- Payload -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Package class="w-5 h-5 inline-block mr-1 opacity-80" />
              Payload Details
            </h4>
            <button
              @click.stop="copyPayload"
              class="px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors border border-border shadow-sm flex items-center gap-1.5"
            >
              <span>{{ copyButtonText }}</span>
            </button>
          </div>
          <pre class="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono border border-border/50 shadow-inner custom-scrollbar">{{ formattedPayload }}</pre>
        </div>
        
        <!-- Chat transcript button -->
        <div v-if="event.chat && event.chat.length > 0" class="flex justify-end pt-2">
          <button
            @click.stop="!isMobile && (showChatModal = true)"
            :class="[
              'px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 shadow-sm text-sm',
              isMobile 
                ? 'bg-muted cursor-not-allowed text-muted-foreground border border-border/50' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20'
            ]"
            :disabled="isMobile"
          >
            <MessageCircle class="w-4 h-4 inline-block opacity-80" />
            <span>
              {{ isMobile ? 'Not available in mobile' : `View Chat Transcript (${event.chat.length} messages)` }}
            </span>
          </button>
        </div>
      </div>
    </div>
    </div>
    <!-- Chat Modal -->
    <ChatTranscriptModal
      v-if="event.chat && event.chat.length > 0"
      :is-open="showChatModal"
      :chat="event.chat"
      @close="showChatModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { HookEvent, HumanInTheLoopResponse } from '../types';
import { useMediaQuery } from '../composables/useMediaQuery';


import { useEventIcons } from '../composables/useEventIcons';
import { Clock, CheckCircle, XCircle, FileText, Package, MessageCircle, Brain, HelpCircle, Lock, Target, Loader2 } from 'lucide-vue-next';

import ChatTranscriptModal from './ChatTranscriptModal.vue';
import { API_BASE_URL } from '../config';


const { getIconForEventType, getIconForToolName } = useEventIcons();

const props = defineProps<{
  event: HookEvent;
  gradientClass: string;
  colorClass: string;
  appGradientClass: string;
  appColorClass: string;
  appHexColor: string;
}>();

const emit = defineEmits<{
  (e: 'response-submitted', response: HumanInTheLoopResponse): void;
}>();

// Existing refs
const isExpanded = ref(false);
const showChatModal = ref(false);
const copyButtonText = ref('Copy');

// New refs for HITL
const responseText = ref('');
const isSubmitting = ref(false);
const hasSubmittedResponse = ref(false);
const localResponse = ref<HumanInTheLoopResponse | null>(null); // Optimistic UI

// Media query for responsive design
const { isMobile } = useMediaQuery();

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const sessionIdShort = computed(() => {
  return props.event.session_id.slice(0, 8);
});



const hookIcon = computed(() => {
  return getIconForEventType(props.event.hook_event_type);
});


const borderColorClass = computed(() => {
  // Convert bg-color-500 to border-color-500
  return props.colorClass.replace('bg-', 'border-');
});


const appBorderStyle = computed(() => {
  return {
    borderColor: props.appHexColor
  };
});

const appBgStyle = computed(() => {
  // Use the hex color with 20% opacity
  return {
    backgroundColor: props.appHexColor + '33' // Add 33 for 20% opacity in hex
  };
});

const formattedPayload = computed(() => {
  return JSON.stringify(props.event.payload, null, 2);
});

const toolName = computed(() => {
  const eventType = props.event.hook_event_type;
  const toolEvents = ['PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest'];
  if (toolEvents.includes(eventType) && props.event.payload?.tool_name) {
    return props.event.payload.tool_name;
  }
  return null;
});


const toolIcon = computed(() => {
  if (!toolName.value) return null;
  return getIconForToolName(toolName.value);
});

const toolInfo = computed(() => {
  const payload = props.event.payload;
  
  // Handle UserPromptSubmit events
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return {
      tool: 'Prompt:',
      detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"`
    };
  }
  
  // Handle PreCompact events
  if (props.event.hook_event_type === 'PreCompact') {
    const trigger = payload.trigger || 'unknown';
    return {
      tool: 'Compaction:',
      detail: trigger === 'manual' ? 'Manual compaction' : 'Auto-compaction (full context)'
    };
  }
  
  // Handle SessionStart events
  if (props.event.hook_event_type === 'SessionStart') {
    const source = payload.source || 'unknown';
    const sourceLabels: Record<string, string> = {
      'startup': 'New session',
      'resume': 'Resuming session',
      'clear': 'Fresh session'
    };
    return {
      tool: 'Session:',
      detail: sourceLabels[source] || source
    };
  }
  
  // Handle tool-based events
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name };
    
    if (payload.tool_input) {
      const input = payload.tool_input;
      if (input.command) {
        info.detail = input.command.slice(0, 50) + (input.command.length > 50 ? '...' : '');
      } else if (input.file_path) {
        info.detail = input.file_path.split('/').pop();
      } else if (input.pattern) {
        info.detail = input.pattern;
      } else if (input.url) {
        // WebFetch
        info.detail = input.url.slice(0, 60) + (input.url.length > 60 ? '...' : '');
      } else if (input.query) {
        // WebSearch
        info.detail = `"${input.query.slice(0, 50)}${input.query.length > 50 ? '...' : ''}"`;
      } else if (input.notebook_path) {
        // NotebookEdit
        info.detail = input.notebook_path.split('/').pop();
      } else if (input.recipient) {
        // SendMessage
        info.detail = `→ ${input.recipient}${input.summary ? ': ' + input.summary : ''}`;
      } else if (input.subject) {
        // TaskCreate
        info.detail = input.subject;
      } else if (input.taskId) {
        // TaskGet, TaskUpdate
        info.detail = `#${input.taskId}${input.status ? ' → ' + input.status : ''}`;
      } else if (input.description && input.subagent_type) {
        // Task (launch agent)
        info.detail = `${input.subagent_type}: ${input.description}`;
      } else if (input.task_id) {
        // TaskOutput, TaskStop
        info.detail = `task: ${input.task_id}`;
      } else if (input.team_name) {
        // TeamCreate
        info.detail = input.team_name;
      } else if (input.skill) {
        // Skill
        info.detail = input.skill;
      }
    }
    
    return info;
  }
  
  return null;
});

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

// Format model name for display (e.g., "opencode-flash-1-5-20251001" -> "flash-1-5")
const formatModelName = (name: string | null | undefined): string => {
  if (!name) return '';

  // Extract model family and version
  // "opencode-flash-1-5-20251001" -> "flash-1-5"
  // "opencode-pro-1-5-20250929" -> "pro-1-5"
  const parts = name.split('-');
  if (parts.length >= 4) {
    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  }
  return name;
};

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(formattedPayload.value);
    copyButtonText.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    copyButtonText.value = 'Failed';
    setTimeout(() => {
      copyButtonText.value = 'Copy';
    }, 2000);
  }
};

// New computed properties for HITL
const hitlTypeIcon = computed(() => {
  if (!props.event.humanInTheLoop) return HelpCircle;
  const iconMap = {
    question: HelpCircle,
    permission: Lock,
    choice: Target
  };
  return iconMap[props.event.humanInTheLoop.type] || HelpCircle;
});

const hitlTypeLabel = computed(() => {
  if (!props.event.humanInTheLoop) return '';
  const labelMap = {
    question: 'Agent Question',
    permission: 'Permission Request',
    choice: 'Choice Required'
  };
  return labelMap[props.event.humanInTheLoop.type] || 'Question';
});

const permissionType = computed(() => {
  return props.event.payload?.permission_type || null;
});

// Methods for HITL responses
const submitResponse = async () => {
  if (!responseText.value.trim() || !props.event.id) return;

  const response: HumanInTheLoopResponse = {
    response: responseText.value.trim(),
    hookEvent: props.event,
    respondedAt: Date.now()
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  const savedText = responseText.value;
  responseText.value = '';
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });

    if (!res.ok) throw new Error('Failed to submit response');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting response:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    responseText.value = savedText;
    alert('Failed to submit response. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const submitPermission = async (approved: boolean) => {
  if (!props.event.id) return;

  const response: HumanInTheLoopResponse = {
    permission: approved,
    hookEvent: props.event,
    respondedAt: Date.now()
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });

    if (!res.ok) throw new Error('Failed to submit permission');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting permission:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    alert('Failed to submit permission. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const submitChoice = async (choice: string) => {
  if (!props.event.id) return;

  const response: HumanInTheLoopResponse = {
    choice,
    hookEvent: props.event,
    respondedAt: Date.now()
  };

  // Optimistic UI: Show response immediately
  localResponse.value = response;
  hasSubmittedResponse.value = true;
  isSubmitting.value = true;

  try {
    const res = await fetch(`${API_BASE_URL}/events/${props.event.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });

    if (!res.ok) throw new Error('Failed to submit choice');

    emit('response-submitted', response);
  } catch (error) {
    console.error('Error submitting choice:', error);
    // Rollback optimistic update
    localResponse.value = null;
    hasSubmittedResponse.value = false;
    alert('Failed to submit choice. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.95;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
</style>