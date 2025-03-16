import React from "react";
import { useTranslation } from "react-i18next";
import { Editor, Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Button, Select, SelectItem } from "@heroui/react";
import { IoChevronDown, IoChevronForward, IoClose, IoPlay, IoSave, IoTerminal, IoSearch, IoMoon, IoSunny, IoRefresh, IoAdd, IoCheckmark, IoClipboard, IoDownload, IoMaximize } from "react-icons/io5";
import { IoMdFolder, IoMdFolderOpen } from "react-icons/io";
import { VscFile, VscFileCode, VscJson } from "react-icons/vsc";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";

type FileSystemItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileSystemItem[];
  content?: string;
  language?: string;
  icon?: React.ReactNode;
  modified?: boolean;
};

// Syntax highlighting colors for different tokens
const syntaxColors: Record<string, string> = {
  keyword: "text-purple-500 font-medium",
  string: "text-emerald-500",
  comment: "text-gray-500 italic",
  number: "text-amber-500",
  function: "text-blue-500",
  operator: "text-zinc-700",
  variable: "text-rose-500",
  property: "text-cyan-500",
  punctuation: "text-zinc-500",
};

export function CodeEditor() {
  const { t } = useTranslation();
  const [code, setCode] = React.useState(
    "// Write your code here\n\nfunction greeting() {\n  console.log('Hello, world!');\n}\n\ngreeting();"
  );
  const [language, setLanguage] = React.useState("javascript");
  const [terminalOutput, setTerminalOutput] = React.useState<string[]>([
    "Terminal initialized",
    "Type 'help' for a list of commands",
  ]);
  const [command, setCommand] = React.useState("");
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [copied, setCopied] = React.useState(false);
  const [activeFile, setActiveFile] = React.useState("main.js");
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(["src", "components"]));
  const [darkMode, setDarkMode] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [openTabs, setOpenTabs] = React.useState<string[]>(["main.js"]);
  const [statusMessage, setStatusMessage] = React.useState("Ready");
  const [accentColor, setAccentColor] = React.useState<string>("blue"); // Default accent color
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = React.useState<"editor" | "terminal">("editor");

  // Available accent colors
  const accentColors = {
    blue: {
      primary: "bg-blue-600",
      secondary: "bg-blue-500",
      text: "text-blue-500",
      hover: "hover:bg-blue-700",
      border: "border-blue-500",
      glow: "shadow-blue-500/20",
      gradientFrom: "from-blue-600",
      gradientTo: "to-indigo-600",
    },
    purple: {
      primary: "bg-purple-600",
      secondary: "bg-purple-500",
      text: "text-purple-500",
      hover: "hover:bg-purple-700",
      border: "border-purple-500",
      glow: "shadow-purple-500/20",
      gradientFrom: "from-purple-600",
      gradientTo: "to-pink-600",
    },
    emerald: {
      primary: "bg-emerald-600",
      secondary: "bg-emerald-500",
      text: "text-emerald-500",
      hover: "hover:bg-emerald-700",
      border: "border-emerald-500",
      glow: "shadow-emerald-500/20",
      gradientFrom: "from-emerald-600",
      gradientTo: "to-teal-600",
    },
  };

  // Get current accent color styles
  const getAccentColor = (key: keyof (typeof accentColors)[keyof typeof accentColors]) => {
    return accentColors[accentColor as keyof typeof accentColors][key];
  };

  // File system data
  const [fileSystem, setFileSystem] = React.useState<FileSystemItem[]>([
    {
      id: "src",
      name: "src",
      type: "folder",
      children: [
        {
          id: "main.js",
          name: "main.js",
          type: "file",
          language: "javascript",
          content:
            "// Write your code here\n\nfunction greeting() {\n  console.log('Hello, world!');\n}\n\ngreeting();",
          icon: <VscFileCode className="h-4 w-4 text-blue-500" />,
          modified: false,
        },
        {
          id: "components",
          name: "components",
          type: "folder",
          children: [
            {
              id: "Button.jsx",
              name: "Button.jsx",
              type: "file",
              language: "javascript",
              content:
                "import React from 'react';\n\nconst Button = ({ children, onClick }) => {\n  return (\n    <button\n      className=\"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600\"\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;",
              icon: <VscFileCode className="h-4 w-4 text-orange-500" />,
              modified: false,
            },
          ],
        },
      ],
    },
    {
      id: ".gitignore",
      name: ".gitignore",
      type: "file",
      language: "text",
      content: "node_modules\n.env\n.DS_Store",
      icon: <VscFile className="h-4 w-4 text-gray-500" />,
      modified: false,
    },
    {
      id: "package.json",
      name: "package.json",
      type: "file",
      language: "json",
      content:
        '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "description": "A sample application",\n  "main": "src/main.js",\n  "scripts": {\n    "start": "webpack serve --mode development",\n    "build": "webpack --mode production",\n    "test": "jest"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "webpack": "^5.88.0",\n    "webpack-cli": "^5.1.4",\n    "webpack-dev-server": "^4.15.1"\n  }\n}',
      icon: <VscJson className="h-4 w-4 text-yellow-600" />,
      modified: false,
    },
  ]);

  // Find file by ID
  const findFileById = (id: string, items: FileSystemItem[] = fileSystem): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Update file in the file system
  const updateFileInSystem = (
    id: string,
    updates: Partial<FileSystemItem>,
    items: FileSystemItem[] = [...fileSystem]
  ): FileSystemItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      if (item.children) {
        return {
          ...item,
          children: updateFileInSystem(id, updates, [...item.children]),
        };
      }
      return item;
    });
  };

  // Handle file click
  const handleFileClick = (file: FileSystemItem) => {
    if (file.type === "file") {
      setActiveFile(file.id);
      if (!openTabs.includes(file.id)) {
        setOpenTabs((prev) => [...prev, file.id]);
      }
      if (file.content) {
        setCode(file.content);
      }
      if (file.language) {
        setLanguage(file.language);
      }
      setStatusMessage(`Opened ${file.name}`);
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);
    // Update file content and mark as modified
    const updatedFileSystem = updateFileInSystem(activeFile, {
      content: value,
      modified: true,
    });
    setFileSystem(updatedFileSystem);
  };

  const handleSaveFile = () => {
    // Simulate saving the file
    const updatedFileSystem = updateFileInSystem(activeFile, {
      modified: false,
    });
    setFileSystem(updatedFileSystem);
    setStatusMessage(`Saved ${activeFile}`);
  };

  const handleCloseTab = (tabId: string) => {
    const newTabs = openTabs.filter((id) => id !== tabId);
    setOpenTabs(newTabs);

    if (activeFile === tabId) {
      // Set active file to the last tab or empty if no tabs left
      if (newTabs.length > 0) {
        const newActiveFile = newTabs[newTabs.length - 1];
        setActiveFile(newActiveFile);
        const file = findFileById(newActiveFile);
        if (file && file.content) {
          setCode(file.content);
        }
        if (file && file.language) {
          setLanguage(file.language);
        }
      } else {
        setActiveFile("");
        setCode("");
      }
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Process command
    const output = processCommand(command);
    setTerminalOutput((prev) => [...prev, `$ ${command}`, ...output]);
    setCommand("");

    // Scroll to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };

  const processCommand = (cmd: string): string[] => {
    const cmdLower = cmd.trim().toLowerCase();
    const cmdParts = cmdLower.split(" ");
    const mainCmd = cmdParts[0];
    const args = cmdParts.slice(1);

    if (mainCmd === "clear") {
      setTimeout(() => setTerminalOutput([]), 0);
      return [];
    }

    if (mainCmd === "help") {
      return [
        "Available commands:",
        "  help                - Show this help message",
        "  clear               - Clear the terminal",
        "  run                 - Run the code in the editor",
        "  ls [directory]      - List files in directory",
        "  cd [directory]      - Change directory",
        "  cat [file]          - Display file contents",
        "  theme [name]        - Change theme color (blue, purple, emerald)",
        "  version             - Show version information",
      ];
    }

    if (mainCmd === "run") {
      return ["Running code...", "> Hello, world!", "Code execution completed."];
    }

    if (mainCmd === "ls") {
      return ["src/", ".gitignore", "package.json"];
    }

    if (mainCmd === "theme" && args.length > 0) {
      const newTheme = args[0];
      if (Object.keys(accentColors).includes(newTheme)) {
        setAccentColor(newTheme as keyof typeof accentColors);
        return [`Theme changed to ${newTheme}`];
      } else {
        return [`Unknown theme: ${newTheme}. Available themes: ${Object.keys(accentColors).join(", ")}`];
      }
    }

    if (mainCmd === "version") {
      return ["Code Editor v2.0.0", "Terminal v2.0.0"];
    }

    return [`Command not found: ${cmd}. Type 'help' for available commands.`];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle up/down arrows for command history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const handleRunCode = () => {
    setTerminalOutput((prev) => [...prev, "$ run", "Running code...", "> Hello, world!", "Code execution completed."]);
    setStatusMessage("Code executed successfully");
    setActiveTab("terminal");

    // Scroll to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setStatusMessage("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    setStatusMessage(`Theme switched to ${!darkMode ? "dark" : "light"} mode`);
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setTimeout(() => {
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  const handleEditorDidMount = React.useCallback(
    (_: editor.IStandaloneCodeEditor, monaco: Monaco): void => {
      monaco.editor.defineTheme("code-editor-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#171717",
        },
      });

      monaco.editor.setTheme("code-editor-theme");
    },
    []
  );

  // Recursive component to render file tree
  const FileTreeItem = ({ item, depth = 0 }: { item: FileSystemItem; depth?: number }) => {
    const isExpanded = item.type === "folder" && expandedFolders.has(item.id);
    const isActive = activeFile === item.id;

    return (
      <div>
        <div
          className={cn(
            "flex items-center py-1 px-2 text-sm cursor-pointer rounded-md group transition-all duration-200",
            isActive
              ? `bg-gradient-to-r ${getAccentColor("gradientFrom")} ${getAccentColor("gradientTo")} text-white shadow-lg`
              : `hover:bg-zinc-800/50 ${darkMode ? "text-zinc-300" : "text-zinc-700"}`
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => (item.type === "folder" ? toggleFolder(item.id) : handleFileClick(item))}
        >
          {item.type === "folder" ? (
            <>
              <div className="mr-1 text-zinc-400">
                {isExpanded ? <IoChevronDown className="h-4 w-4" /> : <IoChevronForward className="h-4 w-4" />}
              </div>
              <div className="mr-1 text-yellow-500">
                {isExpanded ? <IoMdFolderOpen className="h-4 w-4" /> : <IoMdFolder className="h-4 w-4" />}
              </div>
              <span>{item.name}</span>
            </>
          ) : (
            <>
              <div className="mr-2 w-4">{item.icon || <VscFile className="h-4 w-4" />}</div>
              <span>{item.name}</span>
              {item.modified && <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />}
            </>
          )}
        </div>
        {item.type === "folder" && isExpanded && item.children && (
          <div>
            {item.children.map((child) => (
              <FileTreeItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", darkMode ? "bg-zinc-900 text-white" : "bg-white text-black")}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center space-x-2">
          <VscFileCode className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold">Code Editor</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="bg-zinc-800 hover:bg-zinc-700"
            onPress={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <IoSunny className="h-4 w-4" /> : <IoMoon className="h-4 w-4" />}
          </Button>
          <Button
            className="bg-zinc-800 hover:bg-zinc-700"
            onPress={toggleSearch}
            aria-label="Search"
          >
            <IoSearch className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {isSearching && (
        <div className="border-b border-zinc-800 px-4 py-2">
          <div className="flex items-center space-x-2">
            <IoSearch className="h-4 w-4 text-zinc-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in files..."
              className="w-full bg-transparent outline-none"
            />
            <Button
              className="bg-zinc-800 hover:bg-zinc-700"
              onPress={() => setIsSearching(false)}
              aria-label="Close search"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File explorer */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-zinc-800 p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase text-zinc-400">Explorer</span>
            <Button
              className="h-6 w-6 rounded-full bg-zinc-800 p-1 hover:bg-zinc-700"
              onPress={() => {
                // Add new file functionality
                setStatusMessage("New file functionality not implemented");
              }}
              aria-label="New file"
            >
              <IoAdd className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {fileSystem.map((item) => (
              <FileTreeItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Editor and terminal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <div className="flex flex-1 overflow-x-auto">
              {openTabs.map((tabId) => {
                const file = findFileById(tabId);
                return (
                  <div
                    key={tabId}
                    className={cn(
                      "flex items-center space-x-2 border-r border-zinc-800 px-3 py-2",
                      activeFile === tabId ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                    )}
                    onClick={() => handleFileClick(file!)}
                  >
                    <div>{file?.icon || <VscFile className="h-4 w-4" />}</div>
                    <span className="text-sm">{file?.name}</span>
                    {file?.modified && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                    <Button
                      className="ml-1 h-5 w-5 rounded-full p-0 hover:bg-zinc-700"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tabId);
                      }}
                      aria-label="Close tab"
                    >
                      <IoClose className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex border-l border-zinc-800">
              <Button
                className={cn(
                  "px-3 py-2",
                  activeTab === "editor" ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                )}
                onPress={() => setActiveTab("editor")}
                aria-label="Editor"
              >
                <VscFileCode className="h-4 w-4" />
              </Button>
              <Button
                className={cn(
                  "px-3 py-2",
                  activeTab === "terminal" ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                )}
                onPress={() => setActiveTab("terminal")}
                aria-label="Terminal"
              >
                <IoTerminal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor/Terminal content */}
          <div className="relative flex-1 overflow-hidden">
            {/* Editor */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col",
                activeTab === "editor" ? "z-10" : "z-0"
              )}
            >
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Terminal */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col bg-black",
                activeTab === "terminal" ? "z-10" : "z-0"
              )}
            >
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-500"
              >
                {terminalOutput.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>
              <form onSubmit={handleCommandSubmit} className="border-t border-zinc-800 p-2">
                <div className="flex items-center">
                  <span className="mr-2 text-green-500">$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent outline-none text-green-500"
                    placeholder="Enter command..."
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 text-xs text-zinc-400">
            <div>{statusMessage}</div>
            <div className="flex items-center space-x-4">
              <div>{language}</div>
              <div className="flex items-center space-x-2">
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700"
                  onPress={handleSaveFile}
                  aria-label="Save file"
                >
                  <IoSave className="h-4 w-4" />
                </Button>
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700"
                  onPress={handleRunCode}
                  aria-label="Run code"
                >
                  <IoPlay className="h-4 w-4" />
                </Button>
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700"
                  onPress={copyToClipboard}
                  aria-label="Copy code"
                >
                  {copied ? <IoCheckmark className="h-4 w-4" /> : <IoClipboard className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;