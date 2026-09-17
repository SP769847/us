export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isOnline: user.isOnline,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
}

export function privateUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    email: user.email,
    role: user.role,
    status: user.status,
    questionPreference: user.questionPreference,
    whatsappNumber: user.whatsappNumber || null,
    whatsappVerified: Boolean(user.whatsappVerified),
  };
}
