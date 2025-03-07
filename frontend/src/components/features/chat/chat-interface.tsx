import { useDispatch, useSelector } from "react-redux";
import React from "react";
import posthog from "posthog-js";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import { createChatMessage } from "#/services/chat-service";
import { InteractiveChatBox } from "./interactive-chat-box";
import { addUserMessage } from "#/state/chat-slice";
import { RootState } from "#/store";
import { AgentState } from "#/types/agent-state";
import { generateAgentStateChangeEvent } from "#/services/agent-state-service";
import { useScrollToBottom } from "#/hooks/use-scroll-to-bottom";
import { useWsClient } from "#/context/ws-client-provider";
import { Messages } from "./messages";
import { LoadingSpinner } from "#/components/shared/loading-spinner";

function getEntryPoint(
  hasRepository: boolean | null,
  hasImportedProjectZip: boolean | null,
): string {
  if (hasRepository) return "github";
  if (hasImportedProjectZip) return "zip";
  return "direct";
}

export function ChatInterface() {
  const { send, isLoadingMessages } = useWsClient();
  const dispatch = useDispatch();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { onChatBodyScroll } = useScrollToBottom(scrollRef);

  const { messages } = useSelector((state: RootState) => state.chat);
  const { curAgentState } = useSelector((state: RootState) => state.agent);

  const [messageToSend, setMessageToSend] = React.useState<string | null>(null);
  const { selectedRepository, importedProjectZip } = useSelector(
    (state: RootState) => state.initialQuery,
  );

  const handleSendMessage = async (content: string, files: File[]) => {
    if (messages.length === 0) {
      posthog.capture("initial_query_submitted", {
        entry_point: getEntryPoint(
          selectedRepository !== null,
          importedProjectZip !== null,
        ),
        query_character_length: content.length,
        uploaded_zip_size: importedProjectZip?.length,
      });
    } else {
      posthog.capture("user_message_sent", {
        session_message_count: messages.length,
        current_message_length: content.length,
      });
    }
    const promises = files.map((file) => convertImageToBase64(file));
    const imageUrls = await Promise.all(promises);

    const timestamp = new Date().toISOString();
    const pending = true;
    dispatch(addUserMessage({ content, imageUrls, timestamp, pending }));
    send(createChatMessage(content, imageUrls, timestamp));
    setMessageToSend(null);
  };

  const handleStop = () => {
    posthog.capture("stop_button_clicked");
    send(generateAgentStateChangeEvent(AgentState.STOPPED));
  };

  return (
    <div className="h-full w-full flex flex-col  justify-between">
      <div
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        className="flex flex-col grow overflow-y-auto overflow-x-hidden px-2 pt-4 gap-2"
      >
        {isLoadingMessages && (
          <div className="flex justify-center">
            <LoadingSpinner size="small" />
          </div>
        )}

        {!isLoadingMessages && (
          <Messages
            messages={messages}
            isAwaitingUserConfirmation={
              curAgentState === AgentState.AWAITING_USER_CONFIRMATION
            }
          />
        )}
      </div>

      <div className="flex flex-col gap-[6px]  pb-4">
        <InteractiveChatBox
          onSubmit={handleSendMessage}
          onStop={handleStop}
          isDisabled={
            curAgentState === AgentState.LOADING ||
            curAgentState === AgentState.AWAITING_USER_CONFIRMATION
          }
          mode={curAgentState === AgentState.RUNNING ? "stop" : "submit"}
          value={messageToSend ?? undefined}
          onChange={setMessageToSend}
        />
      </div>
    </div>
  );
}
