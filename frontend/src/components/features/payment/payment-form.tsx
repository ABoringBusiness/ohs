import React from "react";
import { useCreateStripeCheckoutSession } from "#/hooks/mutation/stripe/use-create-stripe-checkout-session";
import { useCreateStripeCustomerPortal } from "#/hooks/mutation/stripe/use-create-stripe-customer-portal";
import { useBalance } from "#/hooks/query/use-balance";
import { useUserProfile } from "#/hooks/query/use-user-profile";
import { useUserSubscription } from "#/hooks/query/use-user-subscription";
import { usePaymentHistory } from "#/hooks/query/use-payment-history";
import { cn } from "#/utils/utils";
import MoneyIcon from "#/icons/money.svg?react";
import { SettingsInput } from "../settings/settings-input";
import { BrandButton } from "../settings/brand-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { amountIsValid } from "#/utils/amount-is-valid";

export function PaymentForm() {
  const { data: balance, isLoading: isBalanceLoading } = useBalance();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: subscription, isLoading: isSubscriptionLoading } = useUserSubscription();
  const { data: paymentHistory, isLoading: isHistoryLoading } = usePaymentHistory();
  
  const { mutate: addBalance, isPending: isAddingBalance } = useCreateStripeCheckoutSession();
  const { mutate: openCustomerPortal, isPending: isOpeningPortal } = useCreateStripeCustomerPortal();

  const [buttonIsDisabled, setButtonIsDisabled] = React.useState(true);
  const isLoading = isBalanceLoading || isProfileLoading;
  const isPending = isAddingBalance || isOpeningPortal;

  const billingFormAction = async (formData: FormData) => {
    const amount = formData.get("top-up-input")?.toString();

    if (amount?.trim()) {
      if (!amountIsValid(amount)) return;

      const float = parseFloat(amount);
      addBalance({ amount: Number(float.toFixed(2)) });
    }

    setButtonIsDisabled(true);
  };

  const handleTopUpInputChange = (value: string) => {
    setButtonIsDisabled(!amountIsValid(value));
  };

  const handleManageSubscription = () => {
    openCustomerPortal();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-8 px-11 py-9">
      <h2 className="text-[28px] leading-8 tracking-[-0.02em] font-bold">
        Manage Credits & Subscription
      </h2>

      {/* Balance Display */}
      <div
        className={cn(
          "flex items-center justify-between w-[680px] bg-[#7F7445] rounded px-3 py-2",
          "text-[28px] leading-8 -tracking-[0.02em] font-bold",
        )}
      >
        <div className="flex items-center gap-2">
          <MoneyIcon width={22} height={14} />
          <span>Balance</span>
        </div>
        {!isLoading && (
          <span data-testid="user-balance">
            ${userProfile?.credits || Number(balance).toFixed(2)}
          </span>
        )}
        {isLoading && <LoadingSpinner size="small" />}
      </div>

      {/* Subscription Status */}
      {!isSubscriptionLoading && subscription && (
        <div className="w-[680px] bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Current Subscription</h3>
            <span className={cn(
              "px-2 py-1 rounded text-sm",
              subscription.status === 'active' ? "bg-green-600" : 
              subscription.status === 'trialing' ? "bg-blue-600" : "bg-red-600"
            )}>
              {subscription.status.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p>Plan: <span className="font-semibold capitalize">{subscription.tier}</span></p>
            <p>Renews: <span className="font-semibold">{formatDate(subscription.current_period_end)}</span></p>
          </div>
          <div className="mt-3">
            <BrandButton
              variant="secondary"
              onClick={handleManageSubscription}
              isDisabled={isPending}
            >
              Manage Subscription
            </BrandButton>
          </div>
        </div>
      )}

      {/* Add Credit Form */}
      <form
        action={billingFormAction}
        data-testid="billing-settings"
        className="flex flex-col gap-4 w-[680px]"
      >
        <h3 className="text-xl font-semibold">Add Credits</h3>
        <div className="flex flex-col gap-3">
          <SettingsInput
            testId="top-up-input"
            name="top-up-input"
            onChange={handleTopUpInputChange}
            type="text"
            label="Top-up amount"
            placeholder="Specify an amount to top up your credits"
            className="w-full"
          />

          <div className="flex items-center gap-2">
            <BrandButton
              variant="primary"
              type="submit"
              isDisabled={isPending || buttonIsDisabled}
            >
              Add credit
            </BrandButton>
            {isPending && <LoadingSpinner size="small" />}
          </div>
        </div>
      </form>

      {/* Payment History */}
      {!isHistoryLoading && paymentHistory && paymentHistory.length > 0 && (
        <div className="w-[680px] mt-4">
          <h3 className="text-xl font-semibold mb-3">Payment History</h3>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-t border-gray-700">
                    <td className="px-4 py-2">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-2">${payment.amount.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        payment.status === 'succeeded' ? "bg-green-600" : 
                        payment.status === 'pending' ? "bg-yellow-600" : "bg-red-600"
                      )}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
