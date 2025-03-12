import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import ProfileIcon from "#/icons/profile.svg?react";
import { cn } from "#/utils/utils";
import { Avatar } from "./avatar";
import { TooltipButton } from "#/components/shared/buttons/tooltip-button";

interface UserAvatarProps {
  onClick: () => void;
  avatarUrl?: string;
  isLoading?: boolean;
  label?: string;
}

export function UserAvatar({
  onClick,
  avatarUrl,
  isLoading,
  label,
}: UserAvatarProps) {
  const { t } = useTranslation();
  return (
    <TooltipButton
      testId="user-avatar"
      tooltip={t(I18nKey.USER$ACCOUNT_SETTINGS)}
      ariaLabel={t(I18nKey.USER$ACCOUNT_SETTINGS)}
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center",
        isLoading && "bg-transparent",
      )}
    >
      {!isLoading && avatarUrl && (
        <div className="flex items-center">
          <Avatar src={avatarUrl} />
          {label && <span className="ml-2">{label}</span>}
        </div>
      )}
      {!isLoading && !avatarUrl && (
        <div className="flex items-center">
          <ProfileIcon
            aria-label={t(I18nKey.USER$AVATAR_PLACEHOLDER)}
            width={28}
            height={28}
            className="text-[#9099AC]"
          />
          {label && <span className="ml-2">{label}</span>}
        </div>
      )}
      {isLoading && <LoadingSpinner size="small" />}
    </TooltipButton>
  );
}
