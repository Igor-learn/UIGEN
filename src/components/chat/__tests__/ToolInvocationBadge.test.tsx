import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

test("displays 'Creating filename' for str_replace_editor create command", () => {
  const toolInvocation = {
    toolCallId: "test-1",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/src/App.jsx",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("displays 'Editing filename' for str_replace_editor str_replace command", () => {
  const toolInvocation = {
    toolCallId: "test-2",
    toolName: "str_replace_editor",
    args: {
      command: "str_replace",
      path: "/src/components/Card.tsx",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("displays 'Editing filename' for str_replace_editor insert command", () => {
  const toolInvocation = {
    toolCallId: "test-3",
    toolName: "str_replace_editor",
    args: {
      command: "insert",
      path: "/src/utils/helpers.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("displays 'Viewing filename' for str_replace_editor view command", () => {
  const toolInvocation = {
    toolCallId: "test-4",
    toolName: "str_replace_editor",
    args: {
      command: "view",
      path: "/src/config.json",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Viewing config.json")).toBeDefined();
});

test("displays 'Undoing changes to filename' for str_replace_editor undo_edit command", () => {
  const toolInvocation = {
    toolCallId: "test-5",
    toolName: "str_replace_editor",
    args: {
      command: "undo_edit",
      path: "/src/index.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Undoing changes to index.ts")).toBeDefined();
});

test("displays 'Deleting filename' for file_manager delete command", () => {
  const toolInvocation = {
    toolCallId: "test-6",
    toolName: "file_manager",
    args: {
      command: "delete",
      path: "/src/old-component.jsx",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Deleting old-component.jsx")).toBeDefined();
});

test("displays 'Renaming old to new' for file_manager rename command", () => {
  const toolInvocation = {
    toolCallId: "test-7",
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/src/button.tsx",
      new_path: "/src/Button.tsx",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renaming button.tsx to Button.tsx")).toBeDefined();
});

test("shows spinner for pending state", () => {
  const toolInvocation = {
    toolCallId: "test-8",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/src/NewFile.tsx",
    },
    state: "pending" as const,
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  const spinner = container.querySelector('svg.animate-spin');
  expect(spinner).toBeDefined();
  expect(screen.getByText("Creating NewFile.tsx")).toBeDefined();
});

test("shows green dot for completed state", () => {
  const toolInvocation = {
    toolCallId: "test-9",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/src/CompletedFile.tsx",
    },
    state: "result" as const,
    result: "Success",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  const greenDot = container.querySelector('.bg-emerald-500');
  expect(greenDot).toBeDefined();
  expect(screen.getByText("Creating CompletedFile.tsx")).toBeDefined();
});

test("handles missing path gracefully", () => {
  const toolInvocation = {
    toolCallId: "test-10",
    toolName: "str_replace_editor",
    args: {
      command: "create",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText(/Creating/)).toBeDefined();
});

test("handles unknown command gracefully for str_replace_editor", () => {
  const toolInvocation = {
    toolCallId: "test-11",
    toolName: "str_replace_editor",
    args: {
      command: "unknown_command",
      path: "/src/file.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Modifying file.ts")).toBeDefined();
});

test("handles unknown command gracefully for file_manager", () => {
  const toolInvocation = {
    toolCallId: "test-12",
    toolName: "file_manager",
    args: {
      command: "unknown_command",
      path: "/src/file.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Managing file.ts")).toBeDefined();
});

test("handles unknown tool name by displaying the tool name", () => {
  const toolInvocation = {
    toolCallId: "test-13",
    toolName: "unknown_tool",
    args: {
      path: "/src/file.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("extracts filename from nested path", () => {
  const toolInvocation = {
    toolCallId: "test-14",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/src/components/ui/Button/index.tsx",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating index.tsx")).toBeDefined();
});

test("handles path without slashes", () => {
  const toolInvocation = {
    toolCallId: "test-15",
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "single-file.ts",
    },
    state: "result" as const,
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating single-file.ts")).toBeDefined();
});
