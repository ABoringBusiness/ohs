import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

interface SubmitButtonProps {
  isDisabled?: boolean;
  onClick: () => void;
}

export function SubmitButton({ isDisabled, onClick }: SubmitButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      aria-label={t(I18nKey.BUTTON$SEND)}
      disabled={isDisabled}
      onClick={onClick}
      type="submit"
      className="border border-none rounded-lg h-8 w-8 bg-neutral-700 focus:bg-neutral-500 flex items-center justify-center "
    >
      <img
        src="/test/sendicon.png"
        className="filter invert brightness-200 h-4 w-4"
        alt="sendIcon"
      />
    </button>
  );
}
