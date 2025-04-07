import { useMutation } from "@tanstack/react-query";
import OpenHands from "#/api/open-hands";

export const useCreateSubscription = () =>
  useMutation({
    mutationFn: async (planId: string) => {
      const redirectUrl = await OpenHands.createSubscription(planId);
      window.location.href = redirectUrl;
    },
  });