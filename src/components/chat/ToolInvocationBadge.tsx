"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: "pending" | "result";
  result?: any;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFilename(path: string): string {
  if (!path) return "";
  return path.split("/").pop() || path;
}

function formatToolMessage(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;
  const path = args?.path || "";
  const filename = getFilename(path);

  if (toolName === "str_replace_editor") {
    const command = args?.command;

    switch (command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Viewing ${filename}`;
      case "undo_edit":
        return `Undoing changes to ${filename}`;
      default:
        return `Modifying ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command;

    switch (command) {
      case "delete":
        return `Deleting ${filename}`;
      case "rename":
        const newFilename = getFilename(args?.new_path || "");
        return `Renaming ${filename} to ${newFilename}`;
      default:
        return `Managing ${filename}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const message = formatToolMessage(toolInvocation);
  const isCompleted = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
