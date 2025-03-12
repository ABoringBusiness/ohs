import posthog from "posthog-js";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaListUl } from "react-icons/fa";
import { MdArrowForwardIos, MdArrowBackIos } from "react-icons/md";
import { useDispatch } from "react-redux";
import { NavLink, useLocation } from "react-router";
import { AllHandsLogoButton } from "#/components/shared/buttons/all-hands-logo-button";
import { DocsButton } from "#/components/shared/buttons/docs-button";
import { ExitProjectButton } from "#/components/shared/buttons/exit-project-button";
import { SettingsButton } from "#/components/shared/buttons/settings-button";
import ThemeToggle from "#/components/shared/buttons/ThemeToggle";
import { TooltipButton } from "#/components/shared/buttons/tooltip-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import { useCurrentSettings } from "#/context/settings-context";
import { useLogout } from "#/hooks/mutation/use-logout";
import { useConfig } from "#/hooks/query/use-config";
import { useGitHubUser } from "#/hooks/query/use-github-user";
import { useSettings } from "#/hooks/query/use-settings";
import { useEndSession } from "#/hooks/use-end-session";
import { setCurrentAgentState } from "#/state/agent-slice";
import { AgentState } from "#/types/agent-state";
import { cn } from "#/utils/utils";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import { UserActions } from "./user-actions";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  const endSession = useEndSession();
  const user = useGitHubUser();
  const { data: config } = useConfig();
  const {
    error: settingsError,
    isError: settingsIsError,
    isFetching: isFetchingSettings,
  } = useSettings();
  const { mutateAsync: logout } = useLogout();
  const { settings, saveUserSettings } = useCurrentSettings();

  const [settingsModalIsOpen, setSettingsModalIsOpen] = React.useState(false);
  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
    React.useState(false);

  React.useEffect(() => {
    if (location.pathname === "/settings") {
      setSettingsModalIsOpen(false);
    } else if (
      !isFetchingSettings &&
      settingsIsError &&
      settingsError?.status !== 404
    ) {
      toast.error(
        "Something went wrong while fetching settings. Please reload the page.",
      );
    } else if (settingsError?.status === 404) {
      setSettingsModalIsOpen(true);
    }
  }, [
    settingsError?.status,
    settingsError,
    isFetchingSettings,
    location.pathname,
  ]);

  const handleEndSession = () => {
    dispatch(setCurrentAgentState(AgentState.LOADING));
    endSession();
  };

  const handleLogout = async () => {
    if (config?.APP_MODE === "saas") await logout();
    else await saveUserSettings({ unset_github_token: true });
    posthog.reset();
  };

  return (
    <>
      <aside
        className={cn(
          "h-[40px] md:h-auto px-1 flex flex-row md:flex-col gap-1 transition-all duration-300 ease-in-out",
          isExpanded ? "md:w-[240px]" : "md:w-[40px]",
        )}
      >
        <nav className="flex flex-row md:flex-col justify-between w-full h-auto md:w-auto md:h-full">
          <div
            className={cn(
              "flex flex-row md:flex-col gap-[26px]",
              isExpanded ? "items-start" : "items-center",
            )}
          >
            <div className="flex items-center justify-center">
              <AllHandsLogoButton onClick={handleEndSession} />
            </div>
            <ExitProjectButton
              onClick={handleEndSession}
              label={isExpanded ? "Start new project" : undefined}
            />
            <div className="flex flex-row items-center justify-start">
              <TooltipButton
                testId="toggle-conversation-panel"
                tooltip="Conversations"
                ariaLabel="Conversations"
                onClick={() => setConversationPanelIsOpen((prev) => !prev)}
              >
                <div className="flex items-center">
                  <FaListUl
                    size={22}
                    className={cn(
                      conversationPanelIsOpen ? "text-white" : "text-[#9099AC]",
                    )}
                  />
                  {isExpanded && <span className="ml-2">Conversations</span>}
                </div>
              </TooltipButton>
            </div>
            <DocsButton label={isExpanded ? "Documentation" : undefined} />
          </div>

          <div
            className={cn(
              "flex flex-row md:flex-col gap-[26px] md:mb-4",
              isExpanded ? "items-start" : "items-center",
            )}
          >
            <ThemeToggle label={isExpanded ? "Toggle Theme" : undefined} />
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${isActive ? "text-white" : "text-[#9099AC]"} flex items-center`
              }
            >
              <SettingsButton />
              {isExpanded && <span className="ml-2">Settings</span>}
            </NavLink>
            {!user.isLoading && (
              <UserActions
                user={
                  user.data ? { avatar_url: user.data.avatar_url } : undefined
                }
                onLogout={handleLogout}
                label={isExpanded ? "Account Settings" : undefined}
              />
            )}
            {user.isLoading && <LoadingSpinner size="small" />}
          </div>
        </nav>

        {conversationPanelIsOpen && (
          <ConversationPanelWrapper isOpen={conversationPanelIsOpen}>
            <ConversationPanel
              onClose={() => setConversationPanelIsOpen(false)}
            />
          </ConversationPanelWrapper>
        )}

        <button
          type="button"
          className="p-2 rounded-full self-end justify-center items-center"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? (
            <MdArrowBackIos size={16} />
          ) : (
            <MdArrowForwardIos size={16} />
          )}
        </button>
      </aside>

      {settingsModalIsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsModalIsOpen(false)}
        />
      )}
    </>
  );
}
