import { useSelector } from "react-redux";
import { RootState } from "#/store";
import { useTerminal } from "#/hooks/use-terminal";
import "@xterm/xterm/css/xterm.css";
import { RUNTIME_INACTIVE_STATES } from "#/types/agent-state";
import React from "react";

interface TerminalProps {
  secrets: string[];
}

function Terminal({ secrets }: TerminalProps) {
  const { commands } = useSelector((state: RootState) => state.cmd);
  const { curAgentState } = useSelector((state: RootState) => state.agent);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);

  const terminal = useTerminal({
    commands,
    secrets,
    disabled: RUNTIME_INACTIVE_STATES.includes(curAgentState),
  });

  // Handle keyboard shortcuts for the terminal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F: Show search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Escape: Hide search
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      terminal.search(searchTerm);
    }
  };

  // Handle terminal actions
  const handleClear = () => {
    terminal.clear();
  };

  const handleCopy = () => {
    terminal.copyToClipboard();
  };

  return (
    <div className="h-full p-2 min-h-0 relative">
      {/* Terminal container */}
      <div ref={terminal.ref} className="h-full w-full" />
      
      {/* Terminal toolbar */}
      <div className="absolute top-0 right-0 p-1 flex gap-1 bg-gray-800 bg-opacity-70 rounded-bl">
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
          title="Search (Ctrl+F)"
        >
          Search
        </button>
        <button 
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
          title="Copy terminal content"
        >
          Copy
        </button>
        <button 
          onClick={handleClear}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
          title="Clear terminal (Ctrl+L)"
        >
          Clear
        </button>
      </div>
      
      {/* Search box */}
      {showSearch && (
        <div className="absolute top-10 right-0 p-2 bg-gray-800 rounded-bl">
          <form onSubmit={handleSearch} className="flex gap-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-2 py-1 text-sm bg-gray-700 text-white rounded"
              autoFocus
            />
            <button 
              type="submit"
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Find
            </button>
            <button 
              type="button"
              onClick={() => setShowSearch(false)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Terminal;
