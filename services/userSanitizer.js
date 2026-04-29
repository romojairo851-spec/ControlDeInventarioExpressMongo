// Helper compartido para ocultar datos sensibles del usuario.
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const plainUser = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  const { password, ...safeUser } = plainUser;
  return safeUser;
};

module.exports = {
  sanitizeUser,
};
