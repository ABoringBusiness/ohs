import React from "react";
import { useNavigation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "#/store";
import { addFile, removeFile } from "#/state/initial-query-slice";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import { ChatInput } from "#/components/features/chat/chat-input";
import { cn } from "#/utils/utils";
import { ImageCarousel } from "../features/images/image-carousel";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { LoadingSpinner } from "./loading-spinner";
import { BadgeForSuggestion } from "../features/badge/badge-suggestion";

interface TaskFormProps {
  ref: React.RefObject<HTMLFormElement | null>;
}

export function TaskForm({ ref }: TaskFormProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { files } = useSelector((state: RootState) => state.initialQuery);

  const appIdeas = [
    "AI Chatbot Platform",
    "Task Management Tool",
    "Real-time Collaboration",
    "Personal Finance Tracker",
    "E-learning Dashboard",
    "Health Monitoring App",
    "Automated Resume Builder",
    "Smart Home Controller",
  ];

  const [text, setText] = React.useState("");

  const { mutate: createConversation, isPending } = useCreateConversation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const q = formData.get("q")?.toString();
    createConversation({ q });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-2"
      >
        <div
          className={cn(
            "border border-neutral-600 bg-[#18181a]  rounded-lg text-[17px] leading-5 w-full transition-colors duration-200",
          )}
        >
          {isPending ? (
            <div className="flex justify-center py-[17px]">
              <LoadingSpinner size="small" />
            </div>
          ) : (
            <ChatInput
              name="q"
              onSubmit={() => {
                if (typeof ref !== "function") ref?.current?.requestSubmit();
              }}
              onChange={(message) => setText(message)}
              onImagePaste={async (imageFiles) => {
                const promises = imageFiles.map(convertImageToBase64);
                const base64Images = await Promise.all(promises);
                base64Images.forEach((base64) => {
                  dispatch(addFile(base64));
                });
              }}
              onUpload={async (uploadedFiles) => {
                const promises = uploadedFiles.map(convertImageToBase64);
                const base64Images = await Promise.all(promises);
                base64Images.forEach((base64) => {
                  dispatch(addFile(base64));
                });
              }}
              value={text}
              className="text-[17px] leading-5 py-[17px]"
              disabled={navigation.state === "submitting"}
            />
          )}
        </div>
      </form>
      <div className="flex gap-4 mt-5 flex-wrap">
        {appIdeas.map((textInfo, index) => (
          <BadgeForSuggestion key={index} text={textInfo} />
        ))}
      </div>
      {files.length > 0 && (
        <ImageCarousel
          size="large"
          images={files}
          onRemove={(index) => dispatch(removeFile(index))}
        />
      )}
    </div>
  );
}
