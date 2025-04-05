import { FC, useState } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
  FaVolumeUp,
} from "react-icons/fa";

type VoiceAssistantDialogProps = {
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
};

export const VoiceAssistantDialog: FC<VoiceAssistantDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [transcript] = useState("");

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70">
        <div className="w-80 sm:w-96 bg-gray-900 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-700">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaVolumeUp className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium text-lg text-gray-100">
                Voice Assistant
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-800 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
                aria-label="Close voice assistant"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="min-h-32 flex flex-col items-center justify-center space-y-4">
              {transcript ? (
                <p className="text-center text-sm text-gray-300">
                  {transcript}
                </p>
              ) : (
                <p className="text-center text-sm text-gray-400">
                  {isOpen
                    ? "Listening..."
                    : "Press the microphone to start speaking"}
                </p>
              )}

              {/* Voice visualization */}
              {isOpen && (
                <div className="flex items-center justify-center h-12 gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-purple-400 rounded-full animate-pulse ${
                        i % 2 === 0 ? "h-8" : "h-4"
                      } ${i % 3 === 0 ? "animation-delay-200" : ""} ${i % 5 === 0 ? "animation-delay-500" : ""}`}
                      style={{
                        animationDuration: `${600 + i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex justify-center">
            <button
              onClick={() => setIsOpen(false)}
              className={`rounded-full h-14 w-14 shadow-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isOpen
                  ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                  : "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
              }`}
              aria-label={isOpen ? "Stop listening" : "Start listening"}
            >
              {isOpen ? (
                <FaMicrophoneSlash className="h-5 w-5" />
              ) : (
                <FaMicrophone className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );
};
