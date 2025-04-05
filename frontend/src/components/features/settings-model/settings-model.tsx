import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { useConfig } from "#/hooks/query/use-config";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import SettingsIcon from "#/icons/settings.svg?react";
import { BILLING_SETTINGS } from "#/utils/feature-flags";
import { cn } from "#/utils/utils";
import { NavLink } from "react-router";
import AccountSettingsCustom from "./account-settings-custom";

type SettingsModelProps = {
  open: boolean;
  onclose: () => void;
};
export default function SettingsModel({ onclose }: SettingsModelProps) {
  const { data: config } = useConfig();
  const isSaas = config?.APP_MODE === "saas";
  const ref = useClickOutsideElement<HTMLDivElement>(onclose);
  return (
    <ModalBackdrop>
      <main
        ref={ref}
        data-testid="settings-screen"
        className="bg-base-secondary dark:bg-base-secondary-dark border border-tertiary dark:border-tertiary-dark  rounded-xl flex flex-col h-90vh"
      >
        <header className="px-3 py-1.5 border-b border-b-tertiary dark:border-b-tertiary-dark flex items-center gap-2">
          <SettingsIcon width={16} height={16} />
          <h1 className="text-sm leading-6">Settings</h1>
        </header>

        {isSaas && BILLING_SETTINGS() && (
          <nav
            data-testid="settings-navbar"
            className="flex items-end gap-12 px-11 border-b border-tertiary dark:border-tertiary-dark"
          >
            {[
              { to: "/settings", text: "Account" },
              { to: "/settings/billing", text: "Credits" },
            ].map(({ to, text }) => (
              <NavLink
                end
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 border-transparent py-2.5",
                    isActive && "border-primary",
                  )
                }
              >
                <ul className="text-[#F9FBFE] text-sm">{text}</ul>
              </NavLink>
            ))}
          </nav>
        )}

        <div
          className="flex flex-col overflow-auto "
          style={{ height: "90vh" }}
        >
          <AccountSettingsCustom onClose={onclose} />
        </div>
      </main>
    </ModalBackdrop>
  );
}
