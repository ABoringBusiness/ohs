import { cn } from "#/utils/utils";
import { useEffect, useState } from "react";

interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "paypal",
    name: "PayPal",
    logo: "/placeholder.svg?height=40&width=120",
    description: "Pay with your PayPal account",
  },
  {
    id: "stripe",
    name: "Stripe",
    logo: "/placeholder.svg?height=40&width=120",
    description: "Pay with credit card",
  },
  {
    id: "mollie",
    name: "Mollie",
    logo: "/placeholder.svg?height=40&width=120",
    description: "Pay with European payment methods",
  },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: number;
    period: string;
  };
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("stripe");
  const [isLoading, setIsLoading] = useState(false);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    setIsLoading(true);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 dark:bg-black dark:bg-opacity-70 bg-white bg-opacity-50 backdrop-blur-sm transition-colors"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[500px] dark:bg-zinc-900 bg-white dark:border-zinc-800 border-zinc-300 dark:text-white text-black rounded-lg shadow-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-6 dark:border-zinc-800 border-zinc-300 border-b">
          <h2 className="text-xl font-medium dark:text-white text-black">
            Choose payment method
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium dark:text-zinc-400 text-zinc-600">
                Selected plan
              </h3>
              <div className="text-right">
                <div className="text-sm font-medium">{plan.name}</div>
                <div className="text-2xl font-bold">
                  €{plan.price}
                  <span className="text-sm dark:text-zinc-400 text-zinc-600">
                    /{plan.period}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-colors",
                    selectedMethod === method.id
                      ? "border-blue-600 bg-blue-600/10"
                      : "dark:border-zinc-800 border-zinc-300 dark:hover:border-zinc-700 hover:border-zinc-400",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={() => setSelectedMethod(method.id)}
                        className="appearance-none h-4 w-4 rounded-full dark:border-zinc-700 border-zinc-500 checked:border-blue-600 checked:border-[5px] transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:ring-offset-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm dark:text-zinc-400 text-zinc-600">
                        {method.description}
                      </div>
                    </div>
                  </div>
                  <div className="h-8 w-20 flex items-center justify-center">
                    {/* <img src={method.logo || "/placeholder.svg"} alt={method.name} className="max-h-full max-w-full object-contain" /> */}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            className={cn(
              "w-full py-2 px-4 rounded-md font-medium transition-colors  text-white",
              isLoading
                ? "bg-blue-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
            )}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
