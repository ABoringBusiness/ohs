import { ChatInput } from "#/components/features/chat/chat-input";
import { SuggestionBubble } from "#/components/features/suggestions/suggestion-bubble";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { addFile, removeFile } from "#/state/initial-query-slice";
import { RootState } from "#/store";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import { getRandomKey } from "#/utils/get-random-key";
import { SUGGESTIONS } from "#/utils/suggestions";
import { cn } from "#/utils/utils";
import React, { useState } from "react";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FaInstagram } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "react-router";
import { ImageCarousel } from "../features/images/image-carousel";
import { UploadImageInputV2 } from "../features/images/upload-image-input";
import { LoadingSpinner } from "./loading-spinner";

interface TaskFormProps {
  ref: React.RefObject<HTMLFormElement | null>;
}

export function TaskForm({ ref }: TaskFormProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const { files } = useSelector((state: RootState) => state.initialQuery);

  const [text, setText] = React.useState("");
  const [suggestion, setSuggestion] = React.useState(() => {
    const key = getRandomKey(SUGGESTIONS["non-repo"]);
    return { key, value: SUGGESTIONS["non-repo"][key] };
  });
  const [setInputIsFocused] = React.useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const { mutate: createConversation, isPending } = useCreateConversation();

  const onRefreshSuggestion = () => {
    const suggestions = SUGGESTIONS["non-repo"];
    // remove current suggestion to avoid refreshing to the same suggestion
    const suggestionCopy = { ...suggestions };
    delete suggestionCopy[suggestion.key];

    const key = getRandomKey(suggestionCopy);
    setSuggestion({ key, value: suggestions[key] });
  };

  const onClickSuggestion = () => {
    setText(suggestion.value);
  };

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
        <SuggestionBubble
          suggestion={suggestion}
          onClick={onClickSuggestion}
          onRefresh={onRefreshSuggestion}
        />
        <div className="relative p-2 w-full ">
          <div className="absolute inset-0 shadow-[0_0_10px_4px] shadow-red-400 rounded-lg bg-gradient-to-r from-fuchsia-600 via-red-500 to-blue-700 "></div>
          <div className="relative bg-white rounded-lg shadow-lg">
            <div
              className={cn(
                "flex items-center px-4 rounded-lg text-[17px] leading-5 w-full transition-colors duration-200",
                "bg-white ",
              )}
            >
              <div className="flex pl-3 items-center  gap-2 w-[160px] h-[30px] bg-gray-100 mr-2">
                <FaInstagram className="text-[14px] text-black" />
                <span className="text-[10px] text-black font-bold">
                  Things I can do
                </span>
              </div>
              {isPending ? (
                <div className="flex justify-center py-[17px] ">
                  <LoadingSpinner size="small" />
                </div>
              ) : (
                <ChatInput
                  name="q"
                  onSubmit={() => {
                    if (typeof ref !== "function")
                      ref?.current?.requestSubmit();
                  }}
                  onChange={(message) => setText(message)}
                  onImagePaste={async (imageFiles) => {
                    const promises = imageFiles.map(convertImageToBase64);
                    const base64Images = await Promise.all(promises);
                    base64Images.forEach((base64) => {
                      dispatch(addFile(base64));
                    });
                  }}
                  value={text}
                  maxRows={15}
                  className="text-[17px] leading-5 py-[17px] "
                  buttonClassName="pb-[15px] flex flex-row gap-2 items-center"
                  disabled={navigation.state === "submitting" || !text}
                  renderImageButton={() => (
                    <div className="flex items-center gap-2 ">
                      <FaWandMagicSparkles
                        size={16}
                        className="dark:text-black "
                      />
                      <UploadImageInputV2
                        onUpload={async (uploadedFiles) => {
                          const promises =
                            uploadedFiles.map(convertImageToBase64);
                          const base64Images = await Promise.all(promises);
                          base64Images.forEach((base64) => {
                            dispatch(addFile(base64));
                          });
                        }}
                      />
                    </div>
                  )}
                  inputType="two"
                />
              )}
            </div>
            <div className="dark:bg-black bg-white text-[12px] text-white flex items-center justify-between px-4 rounded-sm dark:border-t-none border-t-1 border-black-700">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-sm">
                  <FaInstagram
                    size={16}
                    className="dark:text-white text-black"
                  />
                </div>
                <span className="font-medium dark:text-white text-black">
                  AI Model &gt;&gt;
                </span>
              </div>

              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setIsPrivate((prev) => !prev);
                }}
              >
                {isPrivate ? (
                  <BsEyeSlash
                    size={16}
                    className="dark:text-white text-black"
                  />
                ) : (
                  <BsEye size={16} className="dark:text-white text-black" />
                )}

                <span className="font-medium dark:text-white text-black">
                  {isPrivate ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-3">
          {[
            "Text > Image",
            "Text > Video",
            "Text > Music",
            "Text > App",
            "Text > App",
          ].map((text) => (
            <div
              key={text}
              className="w-[170px] h-[55px] flex items-center justify-center text-medium dark:bg-white bg-black dark:text-black text-white border-5 border-black rounded-lg font-bold "
            >
              {text}
            </div>
          ))}
        </div>
      </form>

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
