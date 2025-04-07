import React from 'react';
import { useCreateSubscription } from '#/hooks/mutation/stripe/use-create-subscription';
import { useUserSubscription } from '#/hooks/query/use-user-subscription';
import { BrandButton } from '../settings/brand-button';
import { LoadingSpinner } from '#/components/shared/loading-spinner';
import { cn } from '#/utils/utils';

type PlanFeature = {
  name: string;
  included: boolean;
};

type Plan = {
  id: 'basic' | 'pro' | 'enterprise';
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    description: 'Perfect for individuals and small projects',
    features: [
      { name: '100 credits per month', included: true },
      { name: 'Basic AI assistance', included: true },
      { name: 'Standard response time', included: true },
      { name: 'Community support', included: true },
      { name: 'Advanced features', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29.99,
    description: 'Ideal for professionals and teams',
    features: [
      { name: '500 credits per month', included: true },
      { name: 'Advanced AI assistance', included: true },
      { name: 'Faster response time', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced features', included: true },
      { name: 'Priority support', included: false },
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    description: 'For organizations with advanced needs',
    features: [
      { name: '2000 credits per month', included: true },
      { name: 'Premium AI assistance', included: true },
      { name: 'Fastest response time', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'All advanced features', included: true },
      { name: 'Priority support', included: true },
    ],
  },
];

export function SubscriptionPlans() {
  const { data: currentSubscription, isLoading: isSubscriptionLoading } = useUserSubscription();
  const { mutate: createSubscription, isPending } = useCreateSubscription();

  const handleSubscribe = (planId: 'basic' | 'pro' | 'enterprise') => {
    const successUrl = `${window.location.origin}/settings/billing?success=true`;
    const cancelUrl = `${window.location.origin}/settings/billing?canceled=true`;
    
    createSubscription({
      plan: planId,
      successUrl,
      cancelUrl,
    });
  };

  return (
    <div className="flex flex-col gap-8 px-11 py-9">
      <h2 className="text-[28px] leading-8 tracking-[-0.02em] font-bold">
        Subscription Plans
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.tier === plan.id && 
                               currentSubscription?.status === 'active';
          
          return (
            <div 
              key={plan.id}
              className={cn(
                "border rounded-lg p-6 flex flex-col",
                plan.popular ? "border-yellow-500" : "border-gray-700",
                "bg-gray-800 relative"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                  Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <p className="text-gray-300 mb-4">{plan.description}</p>
              
              <div className="flex-grow">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={feature.included ? "text-green-500" : "text-red-500"}>
                        {feature.included ? "✓" : "✗"}
                      </span>
                      <span className={feature.included ? "" : "text-gray-400"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <BrandButton
                variant={plan.popular ? "primary" : "secondary"}
                onClick={() => handleSubscribe(plan.id)}
                isDisabled={isPending || isCurrentPlan}
                className="w-full"
              >
                {isCurrentPlan ? "Current Plan" : "Subscribe"}
                {isPending && <LoadingSpinner size="small" className="ml-2" />}
              </BrandButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}