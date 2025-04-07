import React from "react";
import { cn } from "#/utils/utils";
import { BrandButton } from "../settings/brand-button";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import CheckIcon from "#/icons/check.svg?react";
import { useSubscriptionPlans, Plan } from "#/hooks/query/use-subscription-plans";
import { useCreateSubscription } from "#/hooks/mutation/stripe/use-create-subscription";

export function SubscriptionPlans() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { mutate: subscribe, isPending } = useCreateSubscription();

  const handleSubscribe = (planId: string) => {
    subscribe(planId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-11 py-9">
      <h2 className="text-[28px] leading-8 tracking-[-0.02em] font-bold">
        Subscription Plans
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSubscribe={() => handleSubscribe(plan.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  onSubscribe,
}: {
  plan: Plan;
  onSubscribe: () => void;
}) {
  const { isPending } = useCreateSubscription();
  
  return (
    <div
      className={cn(
        "flex flex-col p-6 rounded-lg border border-gray-200",
        "bg-gray-50 dark:bg-gray-800 dark:border-gray-700",
        "transition-all duration-200 hover:shadow-md"
      )}
    >
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
      
      <div className="text-3xl font-bold mb-6">${plan.price.toFixed(2)}<span className="text-sm font-normal">/month</span></div>
      
      <ul className="mb-6 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start mb-2">
            <CheckIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="flex items-center">
        <BrandButton
          variant="primary"
          onClick={onSubscribe}
          className="w-full"
          isDisabled={isPending}
        >
          {isPending ? "Processing..." : "Subscribe"}
        </BrandButton>
        {isPending && <LoadingSpinner size="small" className="ml-2" />}
      </div>
    </div>
  );
}