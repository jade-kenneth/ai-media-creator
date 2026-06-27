import {
  ApolloServerErrorCode,
  unwrapResolverError,
} from '@apollo/server/errors';
import { HttpException } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';
import { AppError } from '../common/errors/app.error';

export function createGraphqlErrorFormatter(isProduction: boolean) {
  return (
    formattedError: GraphQLFormattedError,
    error: unknown,
  ): GraphQLFormattedError => {
    const originalError = unwrapResolverError(error);

    if (originalError instanceof AppError) {
      return {
        ...formattedError,
        message: originalError.message,
        extensions: {
          ...sanitizeExtensions(formattedError.extensions),
          code: originalError.code,
          http: { status: originalError.status },
          ...(originalError.details ? { details: originalError.details } : {}),
        },
      };
    }

    if (originalError instanceof HttpException) {
      const response = originalError.getResponse();
      const details =
        typeof response === 'object' && response !== null
          ? response
          : undefined;

      return {
        ...formattedError,
        message: resolveHttpExceptionMessage(originalError, response),
        extensions: {
          ...sanitizeExtensions(formattedError.extensions),
          code:
            formattedError.extensions?.code ??
            mapHttpStatusCodeToGraphqlCode(originalError.getStatus()),
          http: { status: originalError.getStatus() },
          ...(details ? { details } : {}),
        },
      };
    }

    const extensions = sanitizeExtensions(formattedError.extensions);
    const extensionCode = extensions?.code;
    const message =
      isProduction &&
      extensionCode === ApolloServerErrorCode.INTERNAL_SERVER_ERROR
        ? 'Internal server error.'
        : formattedError.message;

    return {
      ...formattedError,
      message,
      extensions,
    };
  };
}

function sanitizeExtensions(
  extensions?: GraphQLFormattedError['extensions'],
): GraphQLFormattedError['extensions'] {
  if (!extensions) {
    return undefined;
  }

  const {
    exception: _exception,
    stacktrace: _stacktrace,
    ...safeExtensions
  } = extensions;

  return safeExtensions;
}

function resolveHttpExceptionMessage(
  error: HttpException,
  response: string | object,
): string {
  if (typeof response === 'string') {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof response.message === 'string'
  ) {
    return response.message;
  }

  return error.message;
}

function mapHttpStatusCodeToGraphqlCode(status: number): string {
  switch (status) {
    case 400:
      return ApolloServerErrorCode.BAD_USER_INPUT;
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return ApolloServerErrorCode.INTERNAL_SERVER_ERROR;
  }
}
