import { EventEmitter2 } from '@nestjs/event-emitter';
import { MemberProfile } from 'src/graphql/generated/graphql';
import { MembersService } from './members.service';
import type {
  MemberProfileRecord,
  MembersRepository,
} from './repositories/members.repository';

describe('MembersService batch lookups', () => {
  let membersRepository: jest.Mocked<Pick<MembersRepository, 'list'>>;
  let service: MembersService;

  beforeEach(() => {
    membersRepository = {
      list: jest.fn(),
    };

    service = new MembersService(
      membersRepository as unknown as MembersRepository,
      {} as never,
      {} as never,
      {} as EventEmitter2,
    );
  });

  it('finds many members by user ids with one repository list call', async () => {
    const members = [
      memberRecord({ id: 'member-1', userId: 'user-1', firstName: 'Juan' }),
      memberRecord({
        id: 'member-2',
        userId: 'user-2',
        firstName: 'Maria',
      }),
    ];
    membersRepository.list.mockReturnValue({
      collect: jest.fn(async () => members),
    } as never);

    const result = await service.findManyByUserIds([
      'user-1',
      'user-2',
      'user-1',
    ]);

    expect(membersRepository.list).toHaveBeenCalledTimes(1);
    expect(membersRepository.list).toHaveBeenCalledWith({
      userId: {
        in: ['user-1', 'user-2'],
      },
    });
    expect(result.get('user-1')).toMatchObject<Partial<MemberProfile>>({
      id: 'member-1',
      fullName: 'Juan Santos',
      user: null,
    });
    expect(result.get('user-2')?.fullName).toBe('Maria Santos');
  });

  it('finds many members by ids with one repository list call', async () => {
    const members = [
      memberRecord({ id: 'member-1', userId: 'user-1', firstName: 'Juan' }),
      memberRecord({
        id: 'member-2',
        userId: 'user-2',
        firstName: 'Maria',
      }),
    ];
    membersRepository.list.mockReturnValue({
      collect: jest.fn(async () => members),
    } as never);

    const result = await service.findManyByIds([
      'member-1',
      'member-2',
      'member-1',
    ]);

    expect(membersRepository.list).toHaveBeenCalledTimes(1);
    expect(membersRepository.list).toHaveBeenCalledWith({
      id: {
        in: ['member-1', 'member-2'],
      },
    });
    expect(result.get('member-1')?.fullName).toBe('Juan Santos');
    expect(result.get('member-2')?.fullName).toBe('Maria Santos');
  });

  it('does not call the repository for an empty id list', async () => {
    await expect(service.findManyByUserIds([])).resolves.toEqual(new Map());
    await expect(service.findManyByIds([])).resolves.toEqual(new Map());

    expect(membersRepository.list).not.toHaveBeenCalled();
  });
});

function memberRecord(
  overrides: Partial<MemberProfileRecord>,
): MemberProfileRecord {
  return {
    id: 'member-id',
    userId: 'user-id',
    firstName: 'Juan',
    lastName: 'Santos',
    middleName: null,
    birthdate: null,
    gender: null,
    address: null,
    purok: null,
    contactNumber: null,
    organizationId: 'organization-id',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
