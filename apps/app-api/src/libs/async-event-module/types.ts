export type AsyncEventType = string;

export interface AsyncEvent<TData = unknown, TType extends AsyncEventType = string> {
  type: TType;
  data: TData;
  id: string;
}

export interface AsyncEventModuleOptions {
  context: string;
  kafka: {
    brokers: string[];
    clientId?: string;
    ssl?: boolean;
    username?: string;
    password?: string;
  };
  concurrency?: number;
}
