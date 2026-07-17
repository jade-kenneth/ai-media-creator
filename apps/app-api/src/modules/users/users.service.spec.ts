import { UserRole, type User } from 'src/graphql/generated/graphql';
import type {
  UserRecord,
  UsersRepository,
} from './repositories/users.repository';
import { UsersService } from './users.service';

describe('UsersService batch lookups', () => {
  let usersRepository: jest.Mocked<Pick<UsersRepository, 'list'>>;
  let service: UsersService;

  beforeEach(() => {
    usersRepository = {
      list: jest.fn(),
    };

    service = new UsersService(usersRepository as unknown as UsersRepository);
  });

  it('finds many users by ids with one repository list call', async () => {
    const users = [
      userRecord({ id: 'user-1', email: 'one@example.com' }),
      userRecord({
        id: 'user-2',
        email: 'two@example.com',
        position: 'Captain',
      }),
    ];
    usersRepository.list.mockReturnValue({
      collect: jest.fn(async () => users),
    } as never);

    const result = await service.findManyByIds(['user-1', 'user-2', 'user-1']);

    expect(usersRepository.list).toHaveBeenCalledTimes(1);
    expect(usersRepository.list).toHaveBeenCalledWith({
      id: {
        in: ['user-1', 'user-2'],
      },
    });
    expect(result.get('user-1')).toMatchObject<Partial<User>>({
      id: 'user-1',
      email: 'one@example.com',
      position: null,
    });
    expect(result.get('user-2')?.position).toBe('Captain');
  });

  it('finds many user records by ids with one repository list call', async () => {
    const users = [
      userRecord({ id: 'user-1', firstName: 'Ana' }),
      userRecord({ id: 'user-2', firstName: 'Ben' }),
    ];
    usersRepository.list.mockReturnValue({
      collect: jest.fn(async () => users),
    } as never);

    const result = await service.findManyRecordsByIds([
      'user-1',
      'user-2',
      'user-1',
    ]);

    expect(usersRepository.list).toHaveBeenCalledTimes(1);
    expect(usersRepository.list).toHaveBeenCalledWith({
      id: {
        in: ['user-1', 'user-2'],
      },
    });
    expect(result.get('user-1')?.firstName).toBe('Ana');
    expect(result.get('user-2')?.firstName).toBe('Ben');
  });

  it('does not call the repository for an empty id list', async () => {
    await expect(service.findManyByIds([])).resolves.toEqual(new Map());
    await expect(service.findManyRecordsByIds([])).resolves.toEqual(new Map());

    expect(usersRepository.list).not.toHaveBeenCalled();
  });
});

function userRecord(overrides: Partial<UserRecord>): UserRecord {
  return {
    id: 'user-id',
    email: 'admin@example.com',
    passwordHash: 'hash',
    role: UserRole.ADMIN,
    organizationId: 'organization-id',
    isActive: true,
    firstName: null,
    lastName: null,
    position: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
