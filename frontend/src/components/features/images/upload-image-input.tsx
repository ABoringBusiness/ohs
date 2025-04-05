import Clip from "#/icons/clip.svg?react";
import { FaImage } from "react-icons/fa";

interface UploadImageInputProps {
  onUpload: (files: File[]) => void;
  label?: React.ReactNode;
}

export function UploadImageInput({ onUpload, label }: UploadImageInputProps) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) onUpload(Array.from(event.target.files));
  };

  return (
    <label className="cursor-pointer py-[10px]">
      {label || (
        <Clip
          data-testid="default-label"
          width={24}
          height={24}
          className="stroke-white dark:stroke-black"
        />
      )}
      <input
        data-testid="upload-image-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleUpload}
      />
    </label>
  );
}

export function UploadImageInputV2({ onUpload, label }: UploadImageInputProps) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) onUpload(Array.from(event.target.files));
  };

  return (
    <label className={`cursor-pointer`}>
      {label || <FaImage className="size-7 text-black" />}
      <input
        data-testid="upload-image-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleUpload}
      />
    </label>
  );
}
