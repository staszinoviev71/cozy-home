// __tests__/pairingService.test.ts
import { generatePairCode, createHousehold, joinHousehold } from '../src/services/pairingService';
import { UserProfile } from '../src/types/domain';

describe('PairingService', () => {
  const husband: UserProfile = { id: 'u1', name: 'Муж', role: 'husband', currentMoodId: 'happy', updatedAt: Date.now() };
  const wife: UserProfile = { id: 'u2', name: 'Жена', role: 'wife', currentMoodId: 'cozy', updatedAt: Date.now() };

  it('generates 6-digit pair code', () => {
    const code = generatePairCode();
    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it('creates household with single member', () => {
    const household = createHousehold(husband);
    expect(household.members).toHaveLength(1);
    expect(household.inviteCode).toHaveLength(6);
  });

  it('joins household with valid code and prevents 3rd member', () => {
    const household = createHousehold(husband);
    const updated = joinHousehold(household, wife, household.inviteCode);
    expect(updated.members).toHaveLength(2);

    const intruder: UserProfile = { id: 'u3', name: 'Чужой', role: 'husband', currentMoodId: 'happy', updatedAt: Date.now() };
    expect(() => joinHousehold(updated, intruder, household.inviteCode)).toThrow('Household is full');
  });

  it('throws error when pairing code does not match', () => {
    const household = createHousehold(husband);
    expect(() => joinHousehold(household, wife, '000000')).toThrow('Invalid pair code');
  });
});
