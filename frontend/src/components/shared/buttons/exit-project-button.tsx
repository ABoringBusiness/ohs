import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import PlusIcon from "#/icons/plus.svg?react";
import { TooltipButton } from "./tooltip-button";

interface ExitProjectButtonProps {
  onClick: () => void;
  label?: string;
}

export function ExitProjectButton({ onClick, label }: ExitProjectButtonProps) {
  const { t } = useTranslation();
  const startNewProject = t(I18nKey.PROJECT$START_NEW);

  return (
    <div className="flex items-center">
      <TooltipButton
        tooltip={startNewProject}
        ariaLabel={startNewProject}
        onClick={onClick}
        testId="new-project-button"
      >
        <div className="flex items-center">
          <PlusIcon width={28} height={28} className="text-[#9099AC]" />
          {label && <span className="ml-2">{label}</span>}
        </div>
      </TooltipButton>
    </div>
  );
}
