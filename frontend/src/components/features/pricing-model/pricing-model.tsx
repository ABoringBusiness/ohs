import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { PricingCard } from "./components/pricing-card";

const plans = [
  {
    name: "Starter",
    price: 15,
    period: "month",
    features: [
      "Up to 10,000 data points per month",
      "Email support",
      "Community forum access",
      "Cancel anytime",
    ],
  },
  {
    name: "Pro",
    price: 40,
    period: "quarter",
    featured: true,
    features: [
      "Advanced analytics dashboard",
      "Customizable reports and charts",
      "Real-time data tracking",
      "Integration with third-party tools",
      "Everything in Hobby Plan",
    ],
  },
  {
    name: "Premium",
    price: 120,
    period: "year",
    features: [
      "Unlimited data storage",
      "Customizable dashboards",
      "Advanced data segmentation",
      "Real-time data processing",
      "AI-powered insights and recommendations",
      "Everything in Hobby Plan",
      "Everything in Pro Plan",
    ],
  },
];

type PricingModelProps = {
  open: boolean;
  onClose: () => void;
};

export default function PricingModel({ onClose }: PricingModelProps) {
  const ref = useClickOutsideElement<HTMLDivElement>(onClose);
  return (
    <ModalBackdrop>
      <div
        ref={ref}
        className="dark:bg-zinc-900 bg-white text-black dark:text-white py-20 px-4"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Simple pricing for advanced people
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Our pricing is designed for advanced people who need more features
              and more flexibility.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
