import React from "react";
import { useTranslation } from "react-i18next";
import CodeEditor from "#/components/features/code-editor/code-editor";

export default function CodeEditorRoute() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        <CodeEditor />
      </div>
    </div>
  );
}