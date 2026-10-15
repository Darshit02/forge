import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../lib/api/auth.js";
import { useAuthStore } from "../stores/auth.store.js";
import { analytics } from "../lib/analytics.js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, setAuth, logout: storeLogout } =
    useAuthStore();

  const userQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await authApi.me();
      return res.user;
    },
    enabled: !!accessToken,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      analytics.identify(data.user.id, { email: data.user.email });
      queryClient.setQueryData(["auth-me"], data.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log in");
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      analytics.identify(data.user.id, { email: data.user.email });
      analytics.userSignedUp(data.user.email);
      queryClient.setQueryData(["auth-me"], data.user);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create account");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      storeLogout();
      analytics.reset();
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    user: user || userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
