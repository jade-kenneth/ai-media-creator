import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z
      .object({
        name: z.string().trim().min(1, 'name is required.'),
      })
      .strict(),
  );

  it('returns parsed and normalized input', () => {
    expect(pipe.transform({ name: ' Organization ' })).toEqual({
      name: 'Organization',
    });
  });

  it('throws a bad request with field-level issues', () => {
    expect(() => pipe.transform({ name: '   ' })).toThrow(BadRequestException);

    try {
      pipe.transform({ name: '   ' });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        message: 'Input validation failed.',
        errors: [
          {
            field: 'name',
            message: 'name is required.',
          },
        ],
      });
    }
  });
});
