import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

interface ValidationIssue {
  field: string;
  message: string;
}

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new BadRequestException({
      message: 'Input validation failed.',
      errors: result.error.issues.map(formatIssue),
    });
  }
}

function formatIssue(issue: z.core.$ZodIssue): ValidationIssue {
  return {
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  };
}
