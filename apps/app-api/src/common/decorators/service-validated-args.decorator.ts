import { Args, type ArgsOptions } from '@nestjs/graphql';

export const SERVICE_VALIDATED_ARGS_METADATA = 'serviceValidatedArgs';

export interface ServiceValidatedArg {
  index: number;
  name: string;
}

export function ServiceValidatedArgs(
  name: string,
  options?: ArgsOptions,
): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const argsDecorator = options ? Args(name, options) : Args(name);
    argsDecorator(target, propertyKey, parameterIndex);

    if (propertyKey === undefined) {
      return;
    }

    const existing =
      Reflect.getOwnMetadata(
        SERVICE_VALIDATED_ARGS_METADATA,
        target,
        propertyKey,
      ) ?? [];

    Reflect.defineMetadata(
      SERVICE_VALIDATED_ARGS_METADATA,
      [
        ...existing,
        {
          index: parameterIndex,
          name,
        },
      ],
      target,
      propertyKey,
    );
  };
}
