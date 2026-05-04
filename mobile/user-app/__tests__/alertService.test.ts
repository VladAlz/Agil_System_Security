import { alertService } from '../src/services/alertService';
import type { AlertPayload } from '../src/types';

const validPayload: AlertPayload = {
  userId: 'user-test-123',
  latitude: -1.2487,
  longitude: -78.6181,
  timestamp: new Date().toISOString(),
};

describe('alertService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with alert data when payload is valid', async () => {
    const promise = alertService.sendAlert(validPayload);
    jest.advanceTimersByTime(500);
    const result = await promise;

    expect(result.status).toBe('Active');
    expect(result.id).toBeDefined();
    expect(result.message).toBeTruthy();
  });

  it('rejects when userId is empty', async () => {
    await expect(
      alertService.sendAlert({ ...validPayload, userId: '' }),
    ).rejects.toThrow('userId is required');
  });

  it('returned id is unique across two calls', async () => {
    const p1 = alertService.sendAlert(validPayload);
    jest.advanceTimersByTime(500);
    const r1 = await p1;

    const p2 = alertService.sendAlert(validPayload);
    jest.advanceTimersByTime(500);
    const r2 = await p2;

    expect(r1.id).not.toBe(r2.id);
  });
});
