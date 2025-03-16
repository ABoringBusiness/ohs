import React from "react";
import { useParams } from "react-router";
import CodeEditor from "#/components/features/code-editor/code-editor";

export default function CodeEditorRoute() {
  // Get the conversation ID from the URL params
  useParams();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CodeEditor />
      </div>
    </div>
  );
}