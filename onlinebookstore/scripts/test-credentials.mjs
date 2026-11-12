// Test credentials belong in the current process environment, never in source control.
export function testPassword() {
  const password = process.env.BOOKVERSE_TEST_CUSTOMER_PASSWORD;
  if (!password) throw new Error('Set BOOKVERSE_TEST_CUSTOMER_PASSWORD privately before running account-creating tests.');
  return password;
}
export function adminCredentials() {
  const username = process.env.BOOKVERSE_TEST_ADMIN_USERNAME;
  const password = process.env.BOOKVERSE_TEST_ADMIN_PASSWORD;
  if (!username || !password) throw new Error('Set BOOKVERSE_TEST_ADMIN_USERNAME and BOOKVERSE_TEST_ADMIN_PASSWORD privately before running admin tests.');
  return { username, password };
}
