import {
  SERVICE_VALIDATED_ARGS_METADATA,
  ServiceValidatedArgs,
} from './service-validated-args.decorator';

describe('ServiceValidatedArgs', () => {
  it('marks arguments whose input validation is delegated to the service layer', () => {
    class TestResolver {
      test(@ServiceValidatedArgs('input') input: unknown) {
        return input;
      }
    }

    expect(
      Reflect.getOwnMetadata(
        SERVICE_VALIDATED_ARGS_METADATA,
        TestResolver.prototype,
        'test',
      ),
    ).toEqual([
      {
        index: 0,
        name: 'input',
      },
    ]);
  });
});
