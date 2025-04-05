import { StopButton } from "#/components/shared/buttons/stop-button";
import {
  SubmitButton,
  SubmitButtonTwo,
} from "#/components/shared/buttons/submit-button";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import React from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import { MakeCalls } from "./make-calls";
import SpeechToText from "./voice-assistant";
interface ChatInputProps {
  name?: string;
  button?: "submit" | "stop";
  disabled?: boolean;
  showButton?: boolean;
  showVoice?: boolean;
  value?: string;
  maxRows?: number;
  onSubmit: (message: string) => void;
  onStop?: () => void;
  onChange?: (message: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onImagePaste?: (files: File[]) => void;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
  buttonClassName?: React.HTMLAttributes<HTMLButtonElement>["className"];
  renderImageButton?: () => React.ReactNode;
  inputType?: "one" | "two";
  showMakeCalls?: boolean;
}

export function ChatInput({
  name,
  button = "submit",
  disabled,
  showButton = true,
  showVoice,
  value,
  maxRows = 4,
  onSubmit,
  onStop,
  onChange,
  onFocus,
  onBlur,
  onImagePaste,
  className,
  buttonClassName,
  renderImageButton,
  inputType = "one",
  showMakeCalls,
}: ChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Only handle paste if we have an image paste handler and there are files
    if (onImagePaste && event.clipboardData.files.length > 0) {
      const files = Array.from(event.clipboardData.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      // Only prevent default if we found image files to handle
      if (files.length > 0) {
        event.preventDefault();
        onImagePaste(files);
      }
    }
    // For text paste, let the default behavior handle it
  };

  const handleDragOver = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (onImagePaste && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        onImagePaste(files);
      }
    }
  };

  const handleSubmitMessage = () => {
    const message = value || textareaRef.current?.value || "";
    if (message.trim()) {
      onSubmit(message);
      onChange?.("");
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !disabled &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSubmitMessage();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div
      data-testid="chat-input"
      className="flex items-end justify-end grow gap-1 min-h-6 w-full"
    >
      <TextareaAutosize
        ref={textareaRef}
        name={name}
        placeholder={t(I18nKey.SUGGESTIONS$WHAT_TO_BUILD)}
        onKeyDown={handleKeyPress}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        value={value}
        minRows={1}
        maxRows={maxRows}
        data-dragging-over={isDraggingOver}
        className={cn(
          "grow text-sm self-center placeholder:text-neutral-400 text-white dark:text-black resize-none outline-none ring-0",
          "transition-all duration-200 ease-in-out",
          isDraggingOver ? "rounded-lg px-2" : "bg-transparent",
          className,
        )}
      />
      {showButton && (
        <div
          className={buttonClassName}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          {renderImageButton?.()}
          {showMakeCalls && <MakeCalls />}
          {showVoice && (
            <SpeechToText
              onSpeechToText={(text) => {
                onChange?.(text ?? "");
              }}
            />
          )}
          {button === "submit" &&
            (inputType === "two" ? (
              <SubmitButtonTwo
                isDisabled={disabled}
                onClick={handleSubmitMessage}
              />
            ) : (
              <SubmitButton
                isDisabled={disabled}
                onClick={handleSubmitMessage}
              />
            ))}
          {button === "stop" && (
            <StopButton isDisabled={disabled} onClick={onStop} />
          )}
        </div>
      )}
    </div>
  );
}
