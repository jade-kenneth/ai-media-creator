import {
  AccountDeletionRequestStatus,
  UserRole,
} from '../../graphql/generated/graphql';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';

describe('AccountDeletionRequestsService', () => {
  it('clears auth security before deleting an approved account', async () => {
    const request = deletionRequest();
    const approved = {
      ...request,
      status: AccountDeletionRequestStatus.APPROVED,
    };
    const repository = {
      exists: jest.fn().mockResolvedValue(true),
      find: jest
        .fn()
        .mockResolvedValueOnce(request)
        .mockResolvedValueOnce(approved),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const authService = {
      deleteSecurityForEmail: jest.fn().mockResolvedValue(undefined),
    };
    const organizationsService = {};
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: request.email,
        role: UserRole.USER,
      }),
      deleteById: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AccountDeletionRequestsService(
      repository as never,
      authService as never,
      organizationsService as never,
      usersService as never,
    );

    await expect(
      service.review(
        {
          requestId: request.id,
          status: AccountDeletionRequestStatus.APPROVED,
        },
        'reviewer-1',
      ),
    ).resolves.toEqual(approved);

    expect(authService.deleteSecurityForEmail).toHaveBeenCalledWith(
      request.email,
    );
    expect(usersService.deleteById).toHaveBeenCalledWith('user-1');
    expect(
      authService.deleteSecurityForEmail.mock.invocationCallOrder[0],
    ).toBeLessThan(usersService.deleteById.mock.invocationCallOrder[0]);
  });
});

function deletionRequest() {
  const now = new Date('2026-07-31T00:00:00.000Z');

  return {
    id: 'request-1',
    fullName: 'Example User',
    email: 'user@example.com',
    organizationId: 'organization-1',
    organizationName: 'Example Organization',
    status: AccountDeletionRequestStatus.PENDING,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
