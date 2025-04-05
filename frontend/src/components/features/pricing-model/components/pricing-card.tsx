import { Button } from "@heroui/react";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { PaymentModal } from "./payment-modal";

interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  features: string[];
  featured?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  features,
  featured,
}: PricingCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <>
      <div className="relative p-6 rounded-lg border transition-colors bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800">
        {featured && (
          <div className="absolute -top-2 right-4 bg-black text-white dark:bg-white dark:text-black px-3 py-1 rounded-full text-sm font-medium">
            Featured
          </div>
        )}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-black dark:text-white">
              {name}
            </h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-5xl font-bold tracking-tight text-black dark:text-white">
                €{price}
              </span>
              <span className="ml-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                /{period}
              </span>
            </div>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md"
            onClick={() => setShowPaymentModal(true)}
          >
            Get {name}
          </Button>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="flex flex-row gap-3 items-center text-sm text-zinc-600 dark:text-zinc-300">
                  <FaCheck />
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={{ name, price, period }}
      />
    </>
  );
}
