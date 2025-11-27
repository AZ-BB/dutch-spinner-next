// Helper to validate admin credentials on the server side
export function validateAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return false;
  }

  return username === adminUsername && password === adminPassword;
}

// Extract credentials from Authorization header (Basic auth format)
export function extractCredentialsFromHeader(authHeader: string | null): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    
    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

// Validate request has valid admin auth
export function isValidAdminRequest(authHeader: string | null): boolean {
  const credentials = extractCredentialsFromHeader(authHeader);
  if (!credentials) {
    return false;
  }
  return validateAdminCredentials(credentials.username, credentials.password);
}

