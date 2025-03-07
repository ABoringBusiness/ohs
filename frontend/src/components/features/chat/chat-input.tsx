import React from "react";
import { cn } from "#/utils/utils";
import { SubmitButton } from "#/components/shared/buttons/submit-button";
import { StopButton } from "#/components/shared/buttons/stop-button";
import { Textarea } from "#/components/ui/textarea";
import { ImageInsertButton } from "#/components/shared/buttons/image-button";

interface ChatInputProps {
  name?: string;
  button?: "submit" | "stop";
  disabled?: boolean;
  value?: string;
  onSubmit: (message: string) => void;
  onStop?: () => void;
  onChange?: (message: string) => void;
  onFocus?: () => void;
  onUpload?: (files: File[]) => void;
  onBlur?: () => void;
  onImagePaste?: (files: File[]) => void;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
  buttonClassName?: React.HTMLAttributes<HTMLButtonElement>["className"];
}

export function ChatInput({
  name,
  button = "submit",
  disabled,
  value,
  onSubmit,
  onStop,
  onChange,
  onFocus,
  onBlur,
  onUpload,
  onImagePaste,
  className,
  buttonClassName,
}: ChatInputProps) {
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
      className="flex flex-col items-end justify-end grow  min-h-6 w-full"
    >
      <Textarea
        ref={textareaRef}
        name={name}
        placeholder="Describe the mobile app you want to build...."
        onKeyDown={handleKeyPress}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        value={value}
        data-dragging-over={isDraggingOver}
        className={cn(
          "flex min-h-[60px]   rounded-md border border-input bg-transparent px-3 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm grow self-center placeholder:text-neutral-400 text-white resize-none w-full border-none ring-0 !outline-none focus:border-none focus:ring-0 focus:outline-none transition-all duration-200 ease-in-out bg-none text-[17px] leading-5 py-[17px]",
          "grow text-sm self-center placeholder:text-neutral-400 text-white  resize-none w-full border-none ring-0 outline-none", // Ensure no border from start
          "focus:border-none focus:ring-0 focus:outline-none", // Explicitly disable focus border
          "transition-all duration-200 ease-in-out",

          className,
        )}
      />
      <div className="flex w-full justify-between p-2">
        {onUpload && <ImageInsertButton onUpload={onUpload} />}

        <div className={buttonClassName}>
          {button === "submit" && (
            <SubmitButton isDisabled={disabled} onClick={handleSubmitMessage} />
          )}
          {button === "stop" && (
            <StopButton isDisabled={disabled} onClick={onStop} />
          )}
        </div>
      </div>
    </div>
  );
}
