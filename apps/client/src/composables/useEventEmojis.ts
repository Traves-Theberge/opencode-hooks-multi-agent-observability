// Maps hook event types and tool names to Lucide icon component names
// Used with <DynIcon :name="iconName" /> for rendering

const hookEventIcons: Record<string, string> = {
  'PreToolUse': 'Wrench',
  'PostToolUse': 'CheckCircle',
  'PostToolUseFailure': 'XCircle',
  'PermissionRequest': 'Lock',
  'Notification': 'Bell',
  'Stop': 'OctagonX',
  'SubagentStart': 'Play',
  'SubagentStop': 'Users',
  'PreCompact': 'Package',
  'UserPromptSubmit': 'MessageSquare',
  'SessionStart': 'Rocket',
  'SessionEnd': 'Flag',

  'default': 'HelpCircle'
};

const toolEventIcons: Record<string, string> = {
  'Bash': 'Terminal',
  'Read': 'BookOpen',
  'Write': 'PenTool',
  'Edit': 'Pencil',
  'MultiEdit': 'Pencil',
  'Glob': 'Search',
  'Grep': 'SearchCode',
  'WebFetch': 'Globe',
  'WebSearch': 'Search',
  'NotebookEdit': 'NotebookPen',
  'Task': 'Bot',
  'TaskCreate': 'ClipboardList',
  'TaskGet': 'FileText',
  'TaskUpdate': 'FileEdit',
  'TaskList': 'Files',
  'TaskOutput': 'Upload',
  'TaskStop': 'Square',
  'TeamCreate': 'Users',
  'TeamDelete': 'Trash2',
  'SendMessage': 'MessageSquare',
  'EnterPlanMode': 'Map',
  'ExitPlanMode': 'DoorOpen',
  'AskUserQuestion': 'HelpCircle',
  'Skill': 'Zap',

  'default': 'Wrench'
};

// Short text abbreviations for canvas rendering (canvas can't render Vue components)
const hookEventShortLabels: Record<string, string> = {
  'PreToolUse': '⚙',
  'PostToolUse': '✓',
  'PostToolUseFailure': '✗',
  'PermissionRequest': '🔒',
  'Notification': '🔔',
  'Stop': '⬤',
  'SubagentStart': '▶',
  'SubagentStop': '■',
  'PreCompact': '📦',
  'UserPromptSubmit': '💬',
  'SessionStart': '🚀',
  'SessionEnd': '🏁',
  'default': '?'
};

const toolShortLabels: Record<string, string> = {
  'Bash': '▸',
  'Read': '📖',
  'Write': '✎',
  'Edit': '✏',
  'Glob': '🔍',
  'Grep': '🔎',
  'default': '⚙'
};

export function useEventEmojis() {
  const getHookEventIcon = (hookEventType: string): string => {
    return hookEventIcons[hookEventType] || hookEventIcons['default'];
  };

  const getToolEventIcon = (toolName: string): string => {
    if (toolName.startsWith('mcp__')) return 'Plug';
    return toolEventIcons[toolName] || toolEventIcons['default'];
  };

  const formatEventTypeLabel = (hookEventType: string, toolName?: string): string => {
    const hookIcon = getHookEventIcon(hookEventType);

    if (toolName) {
      const toolIcon = getToolEventIcon(toolName);
      return `${hookIcon}+${toolIcon}`;
    }

    return hookIcon;
  };

  // Chart-compatible label formatter — matches drawBars signature
  // Uses short text symbols for canvas rendering
  const formatChartLabel = (eventTypes: Record<string, number>, toolEvents?: Record<string, number>): string => {
    const parts: string[] = [];

    // Get dominant event type
    const sortedEvents = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);
    if (sortedEvents.length > 0) {
      const [eventType] = sortedEvents[0];
      parts.push(hookEventShortLabels[eventType] || hookEventShortLabels['default']);
    }

    // Get dominant tool
    if (toolEvents) {
      const sortedTools = Object.entries(toolEvents).sort((a, b) => b[1] - a[1]);
      if (sortedTools.length > 0) {
        const [toolName] = sortedTools[0];
        parts.push(toolShortLabels[toolName] || toolShortLabels['default']);
      }
    }

    return parts.join('+');
  };

  return {
    getHookEventIcon,
    getToolEventIcon,
    formatEventTypeLabel,
    formatChartLabel,
    hookEventIcons,
    toolEventIcons
  };
}