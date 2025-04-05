import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { cn } from "#/utils/utils";
import { AgentState } from "#/types/agent-state";
import { RootState } from "#/store";
import { I18nKey } from "#/i18n/declaration";
import React from "react";

export function TerminalStatusLabel() {
  const { t } = useTranslation();
  const { curAgentState } = useSelector((state: RootState) => state.agent);
  const { commands } = useSelector((state: RootState) => state.cmd);
  const [lastCommand, setLastCommand] = React.useState("");
  const [isRunning, setIsRunning] = React.useState(false);
  
  // Track the last command and running state
  React.useEffect(() => {
    if (commands.length > 0) {
      const lastCmd = commands[commands.length - 1];
      
      if (lastCmd.type === "input") {
        setLastCommand(lastCmd.content);
        setIsRunning(true);
      } else if (lastCmd.type === "output") {
        setIsRunning(false);
      }
    }
  }, [commands]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          curAgentState === AgentState.LOADING ||
            curAgentState === AgentState.STOPPED
            ? "bg-red-500 animate-pulse"
            : isRunning 
              ? "bg-yellow-500 animate-pulse" 
              : "bg-green-500",
        )}
      />
      <div className="flex flex-col">
        <span>{t(I18nKey.WORKSPACE$TERMINAL_TAB_LABEL)}</span>
        {lastCommand && (
          <span className="text-xs text-gray-400 truncate max-w-[150px]">
            {isRunning ? `Running: ${lastCommand}` : `Last: ${lastCommand}`}
          </span>
        )}
      </div>
    </div>
  );
}
