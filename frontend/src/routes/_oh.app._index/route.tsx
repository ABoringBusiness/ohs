import { FileExplorer } from "#/components/features/file-explorer/file-explorer";
import { useFiles } from "#/context/files";
import React, { useState } from "react";
import { BsArrowLeft, BsChevronDown } from "react-icons/bs";
import { useRouteError } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="w-full h-full border border-danger rounded-b-xl flex flex-col items-center justify-center gap-2 bg-red-500/5">
      <h1 className="text-3xl font-bold">Oops! An error occurred!</h1>
      {error instanceof Error && <pre>{error.message}</pre>}
    </div>
  );
}

function getLanguageFromPath(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "sh":
    case "bash":
      return "bash";
    case "dockerfile":
      return "dockerfile";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "java":
      return "java";
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";
    case "c":
      return "c";
    case "rb":
      return "ruby";
    case "php":
      return "php";
    case "sql":
      return "sql";
    default:
      return "text";
  }
}

const onlineDevsData = {
  Architecture: ["Alex Chen", "Maria Rodriguez", "Sam Taylor"],
  UI: ["Jordan Lee", "Taylor Kim", "Casey Wong", "Jamie Smith"],
  Mobile: ["Raj Patel", "Nina Johnson", "Carlos Mendez"],
  Backend: ["Sarah Williams", "Ahmed Hassan", "Li Wei", "Olivia Brown"],
  "Prompt Help": ["David Park", "Emma Garcia"],
};

const menuOptions = ["Architecture", "UI", "Mobile", "Backend", "Prompt Help"];

function FileViewer() {
  const [fileExplorerIsOpen, setFileExplorerIsOpen] = React.useState(true);
  const { selectedPath, files } = useFiles();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const toggleFileExplorer = () => {
    setFileExplorerIsOpen((prev) => !prev);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setSelectedOption(null);
    }
  };

  const selectOption = (option: string) => {
    setSelectedOption(option);
  };

  const goBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-full bg-base-secondary dark:bg-base-secondary-dark relative">
        <FileExplorer
          isOpen={fileExplorerIsOpen}
          onToggle={toggleFileExplorer}
        />
        <div className="w-full h-full flex flex-col">
          {selectedPath && (
            <div className="flex w-full items-center justify-between self-end p-2">
              <span className="text-sm text-neutral-500">{selectedPath}</span>
            </div>
          )}
          {selectedPath && files[selectedPath] && (
            <div className="p-4 flex-1 overflow-auto">
              <SyntaxHighlighter
                language={getLanguageFromPath(selectedPath)}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  background: "#171717",
                  fontSize: "0.875rem",
                }}
              >
                {files[selectedPath]}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
      {/* Bottom bar */}
      <div className="flex items-center justify-between w-full px-6 py-3 bg-gradient-to-r from-[#0f0c29] to-[#1a1541]">
        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-600 text-white"
            >
              <span>{selectedOption || "Online"}</span>
              <BsChevronDown
                className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-[50px] left-0 mt-2 bg-[#1a1541] rounded-md shadow-lg z-10 min-w-[220px]">
                {!selectedOption ? (
                  <div className="py-2">
                    {menuOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full text-left px-4 py-2 text-white hover:bg-[#2a2151] transition-colors"
                        onClick={() => selectOption(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="px-4 pb-2">
                      <button
                        className="text-gray-400 hover:text-white transition-colors"
                        onClick={goBack}
                      >
                        <BsArrowLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 pt-1">
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {onlineDevsData[
                          selectedOption as keyof typeof onlineDevsData
                        ].map((dev, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 py-1 text-sm text-gray-200"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                            <span>{dev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2 rounded-md border border-gray-600 text-white">
              <Video className="w-5 h-5" />
              <span className="text-lg">Tutorials</span>
            </button>

            <button className="flex items-center gap-2 px-5 py-2 rounded-md border border-gray-600 text-white">
              <Star className="w-5 h-5" />
              <span className="text-lg">Examples</span>
            </button>
          </div> */}
      </div>
      {/* Bottom bar */}
    </div>
  );
}

export default FileViewer;
