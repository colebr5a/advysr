export const FREE_LIMITS = {
  accounts: 3,
  goals: 2,
  aiQueriesPerMonth: 5,
  portfolioImport: false,
};

export function isPremiumActive(isPremium, subscriptionExpiresAt) {
  if (!isPremium) return false;
  if (!subscriptionExpiresAt) return true; // no expiry = lifetime/managed manually
  return new Date(subscriptionExpiresAt) > new Date();
}

export function getAiQueriesUsed(profile) {
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  if (!profile || profile.aiQueriesResetMonth !== thisMonth) return 0;
  return profile.aiQueriesThisMonth || 0;
}

export function incrementAiQueries(profile) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const alreadyThisMonth = profile?.aiQueriesResetMonth === thisMonth;
  return {
    ...profile,
    aiQueriesResetMonth: thisMonth,
    aiQueriesThisMonth: alreadyThisMonth ? (profile.aiQueriesThisMonth || 0) + 1 : 1,
  };
}
