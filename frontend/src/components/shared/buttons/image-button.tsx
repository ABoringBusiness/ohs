interface ImageInsertButtonProps {
  onUpload: (files: File[]) => void;
}

export function ImageInsertButton({ onUpload }: ImageInsertButtonProps) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) onUpload(Array.from(event.target.files));
  };
  return (
    <button
      type="button"
      className="border border-none rounded-lg h-8 w-8 bg-neutral-700 focus:bg-neutral-500 flex items-center justify-center "
    >
      <img
        src="/test/imageicon.png"
        className="filter invert brightness-200 h-4 w-4"
        alt="image-icon"
      />
      <input
        data-testid="upload-image-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleUpload}
      />
    </button>
  );
}
