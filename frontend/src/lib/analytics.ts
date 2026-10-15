import posthog from "posthog-js";
import { env } from "./env.js";

export const analytics = {
  init: () => {
    if (env.VITE_POSTHOG_KEY) {
      posthog.init(env.VITE_POSTHOG_KEY, {
        api_host: env.VITE_POSTHOG_HOST,
        autocapture: false,
        capture_pageview: true,
      });
    }
  },

  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (env.VITE_POSTHOG_KEY) {
      posthog.identify(userId, traits);
    }
  },

  reset: () => {
    if (env.VITE_POSTHOG_KEY) {
      posthog.reset();
    }
  },

  track: (event: string, properties?: Record<string, unknown>) => {
    if (env.VITE_POSTHOG_KEY) {
      posthog.capture(event, properties);
    } else {
      // In dev or without key, log analytics events in debug mode
      if (import.meta.env.DEV) {
        console.debug(`[Analytics: ${event}]`, properties);
      }
    }
  },

  // Typed events
  userSignedUp: (email: string) => {
    analytics.track("user_signed_up", { email });
  },

  providerAdded: (provider: string) => {
    analytics.track("provider_added", { provider });
  },

  projectCreated: (data: { language: string; framework: string; source: string }) => {
    analytics.track("project_created", data);
  },

  aiMessageSent: (data: { mode: string; model: string }) => {
    analytics.track("ai_message_sent", data);
  },

  aiCodeGenerated: (filesWritten: string[]) => {
    analytics.track("ai_code_generated", { count: filesWritten.length, files: filesWritten });
  },

  endpointDetected: (data: { method: string; path: string; framework?: string }) => {
    analytics.track("endpoint_detected", data);
  },

  apiTestRun: (data: { method: string; path: string; status: number; duration: number }) => {
    analytics.track("api_test_run", data);
  },

  testerPanelOpened: () => {
    analytics.track("tester_panel_opened");
  },
};
