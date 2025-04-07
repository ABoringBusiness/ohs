import posthog from "posthog-js";
import React, { useEffect, useRef, useState } from "react";
import { FaDollarSign, FaHome, FaListUl } from "react-icons/fa";
import { NavLink } from "react-router";
import SettingIcon from "#/assets/icons/9054312_bx_cog_icon.svg?react";
import ThemeToggle from "#/components/shared/buttons/ThemeToggle";
import { AllHandsLogoButton } from "#/components/shared/buttons/all-hands-logo-button";
import { useCurrentSettings } from "#/context/settings-context";
import { useLogout } from "#/hooks/mutation/use-logout";
import { useConfig } from "#/hooks/query/use-config";
import { useGitHubUser } from "#/hooks/query/use-github-user";
import DocsIcon from "#/icons/academy.svg?react";
import { cn } from "#/utils/utils";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import PricingModel from "../pricing-model/pricing-model";
import SettingsModel from "../settings-model/settings-model";
import { UserActions } from "./user-actions";

export default function NewSidebar() {
  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
    React.useState(false);
  const [conversationPanelIsHover, setConversationPanelIsHover] =
    React.useState(false);
  const [settingsIsOpen, setSettingsIsOpen] = React.useState(false);
  const [pricingModelIsOpen, setPricingModelIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const user = useGitHubUser();
  const { data: config } = useConfig();
  const { saveUserSettings } = useCurrentSettings();
  const { mutateAsync: logout } = useLogout();

  const conversationPanelIsHoverRef = useRef<boolean>(false);

  conversationPanelIsHoverRef.current = conversationPanelIsHover;

  const handleLogout = async () => {
    if (config?.APP_MODE === "saas") await logout();
    else await saveUserSettings({ unset_github_token: true });
    posthog.reset();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const navItems = [
    { icon: <FaHome size={24} />, label: "Home", path: "/" },
    {
      icon: <FaListUl size={24} />,
      label: "Conversations",
      notActive: true,
      onClick: () => setConversationPanelIsOpen((prev) => !prev),
      onMouseEnter: () => {
        setConversationPanelIsHover(true);
      },
      onMouseLeave: () => {
        setConversationPanelIsHover(false);
      },
    },
    {
      icon: <DocsIcon width={28} height={28} />,
      label: "Documentation",
      path: "https://docs.all-hands.dev",
    },

    {
      icon: <SettingIcon width={28} height={28} fill="currentColor" />,
      label: "Settings",
      notActive: true,
      onClick: () => {
        setSettingsIsOpen(true);
      },
    },
    {
      icon: <FaDollarSign width={28} height={28} />,
      label: "Pricing",
      notActive: true,
      onClick: () => setPricingModelIsOpen((prev) => !prev),
    },
  ];

  return (
    <>
      <nav
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        ref={sidebarRef}
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          isExpanded ? "w-[300px]" : "w-[40px]",
        )}
      >
        <div className="flex flex-col h-full py-4">
          {/* Logo Section */}
          <div
            className={cn("mb-8 px-2", !isExpanded && "flex justify-center")}
          >
            <AllHandsLogoButton
              onClick={() => {
                window.location.href = "/";
              }}
            />
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-1 flex flex-col mb-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path || "#"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-4 py-3 rounded-full transition-colors duration-200 group",
                    "text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    isActive &&
                      !item?.notActive &&
                      "font-semibold bg-blue-50 dark:bg-blue-900/20",
                    !isExpanded && "justify-center",
                  )
                }
                onClick={item?.onClick}
                onMouseEnter={item.onMouseEnter}
                onMouseLeave={item.onMouseLeave}
                style={{
                  marginTop: item.label === "Settings" ? "auto" : "",
                }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex-shrink-0 transition-colors duration-200",
                        "group-hover:text-blue-500 dark:group-hover:text-blue-400",
                        isActive &&
                          !item?.notActive &&
                          "text-blue-500 dark:text-blue-400",
                      )}
                    >
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <span
                        className={cn(
                          "text-base transition-colors duration-200",
                          "group-hover:text-blue-500 dark:group-hover:text-blue-400 text-black dark:text-white",
                          isActive &&
                            !item?.notActive &&
                            "text-blue-500 dark:text-blue-400",
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Theme Toggle */}
            <div
              className={cn(
                "mt-auto flex items-center gap-4 px-4 py-3 rounded-full transition-colors duration-200",
                "text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                "hover:text-blue-500 dark:hover:text-blue-400",
                !isExpanded && "justify-center",
              )}
            >
              <ThemeToggle
                label={isExpanded ? "Toggle Theme" : ""}
                isExpanded={isExpanded}
              />
            </div>

            {/* User Avatar */}
            <div
              className={cn(
                `flex items-center gap-4 ${isExpanded ? "px-4" : "px-2"} py-3 rounded-full transition-colors duration-200`,
                "text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                "hover:text-blue-500 dark:hover:text-blue-400",
                "cursor-pointer w-full",
                !isExpanded && "justify-center",
              )}
            >
              {!user.isLoading && (
                <UserActions
                  user={
                    user.data ? { avatar_url: user.data.avatar_url } : undefined
                  }
                  onLogout={handleLogout}
                  label={isExpanded ? "Account Settings" : ""}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {(conversationPanelIsOpen || conversationPanelIsHover) && (
        <ConversationPanelWrapper
          isOpen={conversationPanelIsOpen || conversationPanelIsHover}
        >
          <ConversationPanel
            onMouseEnter={() => {
              setConversationPanelIsHover(true);
            }}
            onMouseLeave={() => {
              setConversationPanelIsHover(false);
            }}
            onClose={() => {
              if (conversationPanelIsHoverRef.current) {
                return;
              }
              setConversationPanelIsOpen(false);
            }}
          />
        </ConversationPanelWrapper>
      )}
      {pricingModelIsOpen && (
        <ConversationPanelWrapper isOpen={pricingModelIsOpen}>
          <PricingModel
            open={pricingModelIsOpen}
            onClose={() => setPricingModelIsOpen(false)}
          />
        </ConversationPanelWrapper>
      )}
      {settingsIsOpen && (
        <SettingsModel
          open={settingsIsOpen}
          onclose={() => setSettingsIsOpen(false)}
        />
      )}
    </>
  );
}
