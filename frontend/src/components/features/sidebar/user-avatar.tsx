import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import ProfileIcon from "#/icons/profile.svg?react";
import { cn } from "#/utils/utils";
import { Avatar } from "./avatar";

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center w-full",
        isLoading && "bg-transparent",
      )}
    >
      {!isLoading && avatarUrl && (
        <div className="flex items-center w-full">
          <Avatar src={avatarUrl} />
          {label && <span className="ml-2 flex-grow">{label}</span>}
        </div>
      )}
      {!isLoading && !avatarUrl && (
        <div className="flex items-center w-full">
          <ProfileIcon
            aria-label={t(I18nKey.USER$AVATAR_PLACEHOLDER)}
            width={28}
            height={28}
            className="text-[#9099AC]"
          />
          {label && <span className="ml-2 flex-grow">{label}</span>}
        </div>
      )}
      {isLoading && <LoadingSpinner size="small" />}
    </button>
  );
}
