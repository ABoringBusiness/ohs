import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { SerializeAddon } from "@xterm/addon-serialize";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import React from "react";
import { Command } from "#/state/command-slice";
import { getTerminalCommand } from "#/services/terminal-service";
import { parseTerminalOutput } from "#/utils/parse-terminal-output";
import { useWsClient } from "#/context/ws-client-provider";

/*
  NOTE: Tests for this hook are indirectly covered by the tests for the XTermTerminal component.
  The reason for this is that the hook exposes a ref that requires a DOM element to be rendered.
*/

interface UseTerminalConfig {
  commands: Command[];
  secrets: string[];
  disabled: boolean;
}

const DEFAULT_TERMINAL_CONFIG: UseTerminalConfig = {
  commands: [],
  secrets: [],
  disabled: false,
};

export const useTerminal = ({
  commands,
  secrets,
  disabled,
}: UseTerminalConfig = DEFAULT_TERMINAL_CONFIG) => {
  const { send } = useWsClient();
  const terminal = React.useRef<Terminal | null>(null);
  const fitAddon = React.useRef<FitAddon | null>(null);
  const searchAddon = React.useRef<SearchAddon | null>(null);
  const serializeAddon = React.useRef<SerializeAddon | null>(null);
  const webLinksAddon = React.useRef<WebLinksAddon | null>(null);
  const webglAddon = React.useRef<WebglAddon | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const lastCommandIndex = React.useRef(0);
  const keyEventDisposable = React.useRef<{ dispose: () => void } | null>(null);
  const commandHistory = React.useRef<string[]>([]);
  const commandHistoryIndex = React.useRef<number>(-1);

  const createTerminal = () =>
    new Terminal({
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      theme: {
        background: "#24272E",
        foreground: "#F8F8F8",
        cursor: "#FFFFFF",
        cursorAccent: "#000000",
        selection: "rgba(255, 255, 255, 0.3)",
        black: "#000000",
        red: "#E06C75",
        green: "#98C379",
        yellow: "#E5C07B",
        blue: "#61AFEF",
        magenta: "#C678DD",
        cyan: "#56B6C2",
        white: "#DCDFE4",
        brightBlack: "#5A6374",
        brightRed: "#E06C75",
        brightGreen: "#98C379",
        brightYellow: "#E5C07B",
        brightBlue: "#61AFEF",
        brightMagenta: "#C678DD",
        brightCyan: "#56B6C2",
        brightWhite: "#DCDFE4",
      },
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 5000,
      allowTransparency: true,
      disableStdin: false,
      convertEol: true,
    });

  const initializeTerminal = () => {
    if (terminal.current) {
      // Load all addons
      if (fitAddon.current) terminal.current.loadAddon(fitAddon.current);
      if (searchAddon.current) terminal.current.loadAddon(searchAddon.current);
      if (serializeAddon.current) terminal.current.loadAddon(serializeAddon.current);
      if (webLinksAddon.current) terminal.current.loadAddon(webLinksAddon.current);
      
      // Open terminal in the DOM
      if (ref.current) terminal.current.open(ref.current);
      
      // WebGL addon needs to be loaded after the terminal is opened
      if (webglAddon.current) {
        try {
          terminal.current.loadAddon(webglAddon.current);
        } catch (e) {
          console.warn("WebGL addon could not be loaded:", e);
        }
      }
    }
  };

  const copySelection = (selection: string) => {
    const clipboardItem = new ClipboardItem({
      "text/plain": new Blob([selection], { type: "text/plain" }),
    });

    navigator.clipboard.write([clipboardItem]);
  };

  const pasteSelection = (callback: (text: string) => void) => {
    navigator.clipboard.readText().then(callback);
  };

  const pasteHandler = (event: KeyboardEvent, cb: (text: string) => void) => {
    const isControlOrMetaPressed =
      event.type === "keydown" && (event.ctrlKey || event.metaKey);

    if (isControlOrMetaPressed) {
      if (event.code === "KeyV") {
        pasteSelection((text: string) => {
          terminal.current?.write(text);
          cb(text);
        });
      }

      if (event.code === "KeyC") {
        const selection = terminal.current?.getSelection();
        if (selection) copySelection(selection);
      }
    }

    return true;
  };

  const handleEnter = (command: string) => {
    terminal.current?.write("\r\n");
    
    // Only add non-empty commands to history
    if (command.trim()) {
      // Add command to history and reset history index
      commandHistory.current.push(command);
      // Limit history size to 100 entries
      if (commandHistory.current.length > 100) {
        commandHistory.current.shift();
      }
    }
    
    commandHistoryIndex.current = -1;
    send(getTerminalCommand(command));
  };

  const handleBackspace = (command: string) => {
    terminal.current?.write("\b \b");
    return command.slice(0, -1);
  };
  
  const clearCurrentLine = (command: string) => {
    // Move cursor to the beginning of the line and clear it
    if (command.length > 0 && terminal.current) {
      terminal.current.write("\r" + " ".repeat(command.length + 2) + "\r$ ");
    }
    return "";
  };
  
  const navigateHistory = (direction: 'up' | 'down', currentCommand: string) => {
    const history = commandHistory.current;
    
    if (history.length === 0) return currentCommand;
    
    // Save current command when starting to navigate history
    if (commandHistoryIndex.current === -1 && direction === 'up') {
      // Store current command temporarily at the end of history
      history.push(currentCommand);
      commandHistoryIndex.current = history.length - 1;
    }
    
    if (direction === 'up' && commandHistoryIndex.current > 0) {
      commandHistoryIndex.current--;
    } else if (direction === 'down' && commandHistoryIndex.current < history.length - 1) {
      commandHistoryIndex.current++;
    }
    
    // Get command from history
    const historyCommand = history[commandHistoryIndex.current];
    
    // Clear current line and write the command from history
    if (terminal.current) {
      clearCurrentLine(currentCommand);
      terminal.current.write(historyCommand);
    }
    
    // If we've returned to the original command (at the end of history), remove it
    if (direction === 'down' && commandHistoryIndex.current === history.length - 1) {
      const originalCommand = history.pop() || '';
      commandHistoryIndex.current = -1;
      return originalCommand;
    }
    
    return historyCommand;
  };

  React.useEffect(() => {
    /* Create a new terminal instance */
    terminal.current = createTerminal();
    
    /* Initialize all addons */
    fitAddon.current = new FitAddon();
    searchAddon.current = new SearchAddon();
    serializeAddon.current = new SerializeAddon();
    webLinksAddon.current = new WebLinksAddon((uri) => {
      // Open links in a new tab
      window.open(uri, '_blank');
    });
    
    // WebGL addon is created but only loaded after the terminal is opened
    try {
      webglAddon.current = new WebglAddon();
    } catch (e) {
      console.warn("WebGL addon could not be created:", e);
    }

    let resizeObserver: ResizeObserver | null = null;

    if (ref.current) {
      /* Initialize the terminal in the DOM */
      initializeTerminal();
      terminal.current.write("$ ");

      /* Listen for resize events */
      resizeObserver = new ResizeObserver(() => {
        fitAddon.current?.fit();
      });
      resizeObserver.observe(ref.current);
    }

    return () => {
      // Dispose all addons
      webglAddon.current?.dispose();
      webLinksAddon.current?.dispose();
      serializeAddon.current?.dispose();
      searchAddon.current?.dispose();
      fitAddon.current?.dispose();
      
      // Dispose terminal
      terminal.current?.dispose();
      resizeObserver?.disconnect();
    };
  }, []);

  React.useEffect(() => {
    /* Write commands to the terminal */
    if (terminal.current && commands.length > 0) {
      // Start writing commands from the last command index
      for (let i = lastCommandIndex.current; i < commands.length; i += 1) {
        // eslint-disable-next-line prefer-const
        let { content, type } = commands[i];

        secrets.forEach((secret) => {
          content = content.replaceAll(secret, "*".repeat(10));
        });

        terminal.current?.writeln(
          parseTerminalOutput(content.replaceAll("\n", "\r\n").trim()),
        );

        if (type === "output") {
          terminal.current.write(`\n$ `);
        }
      }

      lastCommandIndex.current = commands.length; // Update the position of the last command
    }
  }, [commands]);

  React.useEffect(() => {
    if (terminal.current) {
      // Dispose of existing listeners if they exist
      if (keyEventDisposable.current) {
        keyEventDisposable.current.dispose();
        keyEventDisposable.current = null;
      }

      let commandBuffer = "";

      if (!disabled) {
        // Add new key event listener and store the disposable
        keyEventDisposable.current = terminal.current.onKey(
          ({ key, domEvent }) => {
            // Handle special keys
            if (domEvent.key === "Enter") {
              handleEnter(commandBuffer);
              commandBuffer = "";
            } else if (domEvent.key === "Backspace") {
              if (commandBuffer.length > 0) {
                commandBuffer = handleBackspace(commandBuffer);
              }
            } else if (domEvent.key === "ArrowUp") {
              // Navigate command history up
              commandBuffer = navigateHistory('up', commandBuffer);
            } else if (domEvent.key === "ArrowDown") {
              // Navigate command history down
              commandBuffer = navigateHistory('down', commandBuffer);
            } else if (domEvent.key === "Escape") {
              // Clear current line
              commandBuffer = clearCurrentLine(commandBuffer);
            } else if (domEvent.key === "c" && domEvent.ctrlKey) {
              // Ctrl+C: Copy selection or cancel command
              const selection = terminal.current?.getSelection();
              if (selection) {
                copySelection(selection);
              } else if (commandBuffer.length > 0) {
                terminal.current?.write("^C\r\n$ ");
                commandBuffer = "";
              }
            } else if (domEvent.key === "l" && domEvent.ctrlKey) {
              // Ctrl+L: Clear screen
              terminal.current?.clear();
              terminal.current?.write("$ " + commandBuffer);
            } else if (domEvent.key === "u" && domEvent.ctrlKey) {
              // Ctrl+U: Clear line before cursor
              commandBuffer = clearCurrentLine(commandBuffer);
            } else if (domEvent.key === "f" && domEvent.ctrlKey) {
              // Ctrl+F: Open search
              searchAddon.current?.findNext(prompt("Search for:") || "");
            } else {
              // Ignore paste event
              if (key.charCodeAt(0) === 22) {
                return;
              }
              
              // Regular key input
              commandBuffer += key;
              terminal.current?.write(key);
            }
          },
        );

        // Add custom key handler and store the disposable
        terminal.current.attachCustomKeyEventHandler((event) =>
          pasteHandler(event, (text) => {
            commandBuffer += text;
          }),
        );
      } else {
        // Add a noop handler when disabled
        keyEventDisposable.current = terminal.current.onKey((e) => {
          e.domEvent.preventDefault();
          e.domEvent.stopPropagation();
        });
      }
    }

    return () => {
      if (keyEventDisposable.current) {
        keyEventDisposable.current.dispose();
        keyEventDisposable.current = null;
      }
    };
  }, [disabled]);

  // Expose terminal API for external control
  const terminalApi = React.useMemo(() => ({
    clear: () => {
      terminal.current?.clear();
      terminal.current?.write("$ ");
    },
    search: (searchTerm: string) => {
      searchAddon.current?.findNext(searchTerm);
    },
    copyToClipboard: () => {
      const content = serializeAddon.current?.serialize();
      if (content) {
        navigator.clipboard.writeText(content);
        return true;
      }
      return false;
    },
    focus: () => {
      terminal.current?.focus();
    },
    fit: () => {
      fitAddon.current?.fit();
    },
    write: (text: string) => {
      terminal.current?.write(text);
    },
    ref
  }), []);

  return terminalApi;
};
