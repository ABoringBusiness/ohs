import { useTranslation } from "react-i18next";
import DocsIcon from "#/icons/academy.svg?react";
import { I18nKey } from "#/i18n/declaration";
import { TooltipButton } from "./tooltip-button";

interface DocsButtonProps {
  label?: string;
}

export function DocsButton({ label }: DocsButtonProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <TooltipButton
        tooltip={t(I18nKey.SIDEBAR$DOCS)}
        ariaLabel={t(I18nKey.SIDEBAR$DOCS)}
        href="https://docs.all-hands.dev"
      >
        <div className="flex items-center">
          <DocsIcon width={28} height={28} className="text-[#9099AC]" />
          {label && <span className="ml-2">{label}</span>}
        </div>
      </TooltipButton>
    </div>
  );
}
