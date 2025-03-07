import React from "react";
import { ChatInput } from "./chat-input";
import { cn } from "#/utils/utils";
import { ImageCarousel } from "../images/image-carousel";

interface InteractiveChatBoxProps {
  isDisabled?: boolean;
  mode?: "stop" | "submit";
  onSubmit: (message: string, images: File[]) => void;
  onStop: () => void;
  value?: string;
  onChange?: (message: string) => void;
}

export function InteractiveChatBox({
  isDisabled,
  mode = "submit",
  onSubmit,
  onStop,
  value,
  onChange,
}: InteractiveChatBoxProps) {
  const [images, setImages] = React.useState<File[]>([]);

  const handleUpload = (files: File[]) => {
    setImages((prevImages) => [...prevImages, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = (message: string) => {
    onSubmit(message, images);
    setImages([]);
    if (message) {
      onChange?.("");
    }
  };

  return (
    <div
      data-testid="interactive-chat-box"
      className="flex flex-col gap-[10px]  px-2  py-1 border-t-2 border-[#18181a]"
    >
      {images.length > 0 && (
        <ImageCarousel
          size="small"
          images={images.map((image) => URL.createObjectURL(image))}
          onRemove={handleRemoveImage}
        />
      )}

      <div
        className={cn(
          "flex items-end gap-1",
          "bg-[#272729] border-none rounded-lg px-2",
          "transition-colors duration-200",
        )}
      >
        <ChatInput
          disabled={isDisabled}
          button={mode}
          onChange={onChange}
          onSubmit={handleSubmit}
          onStop={onStop}
          onUpload={handleUpload}
          value={value}
          onImagePaste={handleUpload}
          className="py-[10px]"
        />
      </div>
    </div>
  );
}
