import { I18nKey } from "#/i18n/declaration";
import ArrowSendIcon from "#/icons/arrow-send.svg?react";
import { useTranslation } from "react-i18next";
import { BsChevronRight } from "react-icons/bs";

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
      className="border border-white rounded-lg w-6 h-6 hover:bg-neutral-500 focus:bg-neutral-500 flex items-center justify-center"
    >
      <ArrowSendIcon className="stroke-white dark:stroke-black" />
    </button>
  );
}

export function SubmitButtonTwo({ isDisabled, onClick }: SubmitButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      aria-label={t(I18nKey.BUTTON$SEND)}
      disabled={isDisabled}
      onClick={onClick}
      type="submit"
      className="border border-white rounded-md w-7 h-7 dark:bg-black bg-white flex items-center justify-center"
    >
      {<BsChevronRight className="size-3 dark:text-white text-black" />}
    </button>
  );
}
