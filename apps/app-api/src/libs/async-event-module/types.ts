export interface AsyncEventPayloads {
  SuccessfulSignup: {
    emailAddress: string;
    firstName: string;
  };
  PasswordResetRequested: {
    emailAddress: string;
    resetToken: string;
  };

  JoinWaitlist: {
    emailAddress: string;
  };
}

export type AsyncEventType = keyof AsyncEventPayloads;

export interface AsyncEvent<TType extends AsyncEventType = AsyncEventType> {
  type: TType;
  data: AsyncEventPayloads[TType];
  id: string;
}
export interface AsyncEventModuleOptions {
  context: string; // topic suffix
  kafka: {
    brokers: string[];
    clientId?: string;
  };
  redis?: {
    host: string;
    port: number;
  };
  concurrency?: number;
}
