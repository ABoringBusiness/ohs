import { VoiceAssistantDialog } from "#/components/shared/voice-assistant-dialog";
import { generateAIResponse, summarizeConversation } from "#/services/open-ai";
import { usePlayer } from "#/utils/player";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import React, { FC, useEffect, useState } from "react";

type SpeechToTextProps = {
  onSpeechToText: (text: string) => void;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  latency?: number;
};

export default function SpeechToText({ onSpeechToText }: SpeechToTextProps) {
  const [recording, setRecording] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleStartRecording = async () => {
    setRecording(true);
  };

  const handleStopRecording = async () => {
    setRecording(false);
    const summarizedConversation = await summarizeConversation(messages);
    onSpeechToText(summarizedConversation ?? "");
  };

  return (
    <div className="flex items-center justify-center">
      {recording && (
        <VoiceAssistant
          recording={recording}
          setMessages={setMessages}
          messages={messages}
        />
      )}
      <VoiceAssistantDialog
        isOpen={recording}
        setIsOpen={(open) => {
          if (!open) {
            handleStopRecording();
            return;
          }
          setRecording(open);
        }}
      />
      {recording ? (
        <button onClick={handleStopRecording}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            // fill="white dark:fill-black"
            className="size-5 text-black fill-white dark:fill-black"
          >
            <path
              fillRule="evenodd"
              d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleStartRecording}
          className="text-black dark:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            // fill="white"
            className="size-5 fill-white dark:fill-black"
          >
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

type VoiceAssistantProps = {
  recording: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};
const VoiceAssistant: FC<VoiceAssistantProps> = ({
  recording,
  messages,
  setMessages,
}) => {
  const player = usePlayer();

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: "audio/wav" });
      handleAIResponse(blob);
    },
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
  });

  useEffect(() => {
    if (!vad) {
      return;
    }
    if (recording) {
      vad.start();
    } else {
      vad.pause();
    }
  }, [recording]);

  const handleAIResponse = async (input: Blob) => {
    const file = new File([input], "audio.wav", { type: "audio/wav" });
    const { voice, response, transcript } = await generateAIResponse(
      file,
      messages,
    );
    if (voice) {
      player.play(voice, () => {
        const isFirefox = navigator.userAgent.includes("Firefox");
        if (isFirefox) vad.start();
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: transcript ?? "",
      },
      {
        role: "assistant",
        content: response ?? "",
      },
    ]);
  };
  return <></>;
};
