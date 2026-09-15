import validator from 'validator';

export function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email);
}

export function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function sanitizeText(value, maxLen = 5000) {
  if (typeof value !== 'string') return value;
  return value.trim().slice(0, maxLen);
}
