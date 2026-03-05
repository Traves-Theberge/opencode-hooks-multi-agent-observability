import {
    Wrench, CheckCircle, XCircle, Lock, Bell, Octagon, CircleDot, Users, Package,
    MessageCircle, Rocket, Flag, HelpCircle, Laptop, BookOpen, PenTool, Pencil,
    Search, Globe, Book, Bot, Clipboard, FileText, Bookmark, Upload, Square,
    Trash2, Map, DoorOpen, Zap, Plug
} from 'lucide-vue-next';
import type { Component } from 'vue';

const eventTypeToIcon: Record<string, Component> = {
    'PreToolUse': Wrench,
    'PostToolUse': CheckCircle,
    'PostToolUseFailure': XCircle,
    'PermissionRequest': Lock,
    'Notification': Bell,
    'Stop': Octagon,
    'SubagentStart': CircleDot,
    'SubagentStop': Users,
    'PreCompact': Package,
    'UserPromptSubmit': MessageCircle,
    'SessionStart': Rocket,
    'SessionEnd': Flag,
    'default': HelpCircle
};

const toolNameToIcon: Record<string, Component> = {
    'Bash': Laptop,
    'Read': BookOpen,
    'Write': PenTool,
    'Edit': Pencil,
    'MultiEdit': Pencil,
    'Glob': Search,
    'Grep': Search,
    'WebFetch': Globe,
    'WebSearch': Search,
    'NotebookEdit': Book,
    'Task': Bot,
    'TaskCreate': Clipboard,
    'TaskGet': FileText,
    'TaskUpdate': Pencil, // using Pencil instead since FileEdit isn't used
    'TaskList': Bookmark,
    'TaskOutput': Upload,
    'TaskStop': Square,
    'TeamCreate': Users,
    'TeamDelete': Trash2,
    'SendMessage': MessageCircle,
    'EnterPlanMode': Map,
    'ExitPlanMode': DoorOpen,
    'AskUserQuestion': HelpCircle,
    'Skill': Zap,
    'default': Wrench
};

export function useEventIcons() {
    const getIconForEventType = (eventType: string): Component => {
        return eventTypeToIcon[eventType] || eventTypeToIcon.default;
    };

    const getIconForToolName = (toolName: string): Component => {
        if (toolNameToIcon[toolName]) return toolNameToIcon[toolName];
        if (toolName.startsWith('mcp__')) return Plug;
        return toolNameToIcon.default;
    };

    return {
        getIconForEventType,
        getIconForToolName,
        eventTypeToIcon,
        toolNameToIcon
    };
}
