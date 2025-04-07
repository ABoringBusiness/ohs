import { useQuery } from "@tanstack/react-query";
import OpenHands from "#/api/open-hands";

export type Plan = {
  id: string;
  name: string;
  description: string;
  price_id: string;
  price: number;
  features: string[];
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await OpenHands.getSubscriptionPlans();
      return response.plans;
    },
  });
};