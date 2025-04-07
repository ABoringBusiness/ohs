import { redirect, useSearchParams } from "react-router";
import React from "react";
import { PaymentForm } from "#/components/features/payment/payment-form";
import { SubscriptionPlans } from "#/components/features/payment/subscription-plans";
import { GetConfigResponse } from "#/api/open-hands.types";
import { queryClient } from "#/entry.client";
import {
  displayErrorToast,
  displaySuccessToast,
} from "#/utils/custom-toast-handlers";
import { BILLING_SETTINGS } from "#/utils/feature-flags";

export const clientLoader = async () => {
  const config = queryClient.getQueryData<GetConfigResponse>(["config"]);

  if (config?.APP_MODE !== "saas" || !BILLING_SETTINGS()) {
    return redirect("/settings");
  }

  return null;
};

function BillingSettingsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [activeTab, setActiveTab] = React.useState<"credits" | "plans">("credits");

  React.useEffect(() => {
    if (success === "true") {
      displaySuccessToast("Payment successful");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    } else if (canceled === "true") {
      displayErrorToast("Payment cancelled");
    }

    // Clean up the URL parameters
    if (success || canceled) {
      setSearchParams({});
    }
  }, [success, canceled, setSearchParams]);

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "credits"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("credits")}
        >
          Credits
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "plans"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("plans")}
        >
          Subscription Plans
        </button>
      </div>

      {activeTab === "credits" ? <PaymentForm /> : <SubscriptionPlans />}
    </div>
  );
}

export default BillingSettingsScreen;
