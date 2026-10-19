import { Household, UserProfile } from '../types/domain';

/**
 * Generates a random 6-digit numeric pairing code.
 */
export function generatePairCode(): string {
  const code = Math.floor(Math.random() * 1000000);
  return code.toString().padStart(6, '0');
}

/**
 * Creates a new household with the initial user profile.
 */
export function createHousehold(user: UserProfile, customCode?: string): Household {
  return {
    id: `household_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    inviteCode: customCode || generatePairCode(),
    members: [user],
    createdAt: Date.now(),
  };
}

/**
 * Adds a user to a household using the invite code.
 * Enforces a strict 2-member limit for the couple.
 */
export function joinHousehold(household: Household, user: UserProfile, code: string): Household {
  if (household.inviteCode !== code) {
    throw new Error('Invalid pair code');
  }

  if (household.members.some((m) => m.id === user.id)) {
    return household;
  }

  if (household.members.length >= 2) {
    throw new Error('Household is full');
  }

  return {
    ...household,
    members: [...household.members, user],
  };
}
