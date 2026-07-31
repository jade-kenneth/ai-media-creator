export {};

type TurnstileRenderOptions = {
  action?: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  sitekey: string;
  theme?: 'auto' | 'light' | 'dark';
};

type TurnstileApi = {
  remove?: (widgetId: string) => void;
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
};

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: (
        listener?: (notification: {
          isNotDisplayed: () => boolean;
          isSkippedMoment: () => boolean;
        }) => void,
      ) => void;
      renderButton: (
        container: HTMLElement,
        options: {
          type?: 'standard' | 'icon';
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'small' | 'medium' | 'large';
          text?: 'signin_with' | 'signup_with' | 'continue_with';
          shape?: 'rectangular' | 'pill';
          width?: number;
        },
      ) => void;
      disableAutoSelect: () => void;
    };
  };
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    google?: GoogleIdentityApi;
  }
}
