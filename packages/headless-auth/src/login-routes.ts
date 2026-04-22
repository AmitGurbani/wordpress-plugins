/**
 * Password Login Endpoint
 *
 * REST route for username/email + password authentication.
 */

import { RestRoute } from 'wpts';

class LoginRoutes {
  @RestRoute('/auth/login', { method: 'POST', public: true })
  login(request: any): any {
    // Check if password login is enabled
    const enabled: string = getOption('headless_auth_enable_password_login', '1');
    if (enabled !== '1') {
      return new WP_Error('login_disabled', __('Password login is disabled.', 'headless-auth'), {
        status: 403,
      });
    }

    const login: string = sanitizeTextField(request.get_param('username'));
    // Password is NOT sanitized — sanitize_text_field strips special chars needed for hash comparison
    const password: string = request.get_param('password');

    if (!login || !password) {
      return new WP_Error(
        'missing_params',
        __('Username/email and password are required.', 'headless-auth'),
        {
          status: 400,
        },
      );
    }

    // Rate limiting by login hash
    const loginHash: string = md5(login);
    const attemptsKey: string = `headless_auth_login_attempts_${loginHash}`;
    const currentAttempts: any = getTransient(attemptsKey);
    const maxAttempts: number = Math.max(
      1,
      intval(getOption('headless_auth_max_login_attempts', 5)),
    );
    const rateLimitWindow: number = Math.max(
      60,
      intval(getOption('headless_auth_rate_limit_window', 900)),
    );

    if (currentAttempts && intval(currentAttempts) >= maxAttempts) {
      return new WP_Error(
        'too_many_attempts',
        __('Too many login attempts. Please try again later.', 'headless-auth'),
        {
          status: 429,
        },
      );
    }

    // Authenticate with WordPress (accepts both username and email since WP 4.5.0)
    const user: any = wpAuthenticate(login, password);

    if (isWpError(user)) {
      // Increment failed attempts — generic error prevents user enumeration
      const newAttempts: number = currentAttempts ? intval(currentAttempts) + 1 : 1;
      setTransient(attemptsKey, strval(newAttempts), rateLimitWindow);
      return new WP_Error(
        'invalid_credentials',
        __('Invalid username/email or password.', 'headless-auth'),
        {
          status: 401,
        },
      );
    }

    // Success — clear rate limiting
    deleteTransient(attemptsKey);

    // Resolve user ID — wp_authenticate returns WP_User object,
    // but wpts transpiles .property as array access which fails on objects.
    // Use usernameExists/emailExists which return scalar IDs.
    let userId: number = intval(usernameExists(login));
    if (!userId) {
      userId = intval(emailExists(login));
    }
    const secret: string = getOption('headless_auth_jwt_secret_key', '');
    if (!secret) {
      return new WP_Error('config_error', __('JWT is not configured.', 'headless-auth'), {
        status: 403,
      });
    }
    const accessExpiry: number = intval(getOption('headless_auth_jwt_access_expiry', 3600));
    const refreshExpiry: number = intval(getOption('headless_auth_jwt_refresh_expiry', 604800));

    const accessToken: string = applyFilters(
      'headless_auth_generate_jwt',
      '',
      userId,
      'access',
      accessExpiry,
      secret,
    );
    const refreshToken: string = applyFilters(
      'headless_auth_generate_jwt',
      '',
      userId,
      'refresh',
      refreshExpiry,
      secret,
    );

    updateUserMeta(userId, 'headless_auth_refresh_token_hash', wpHashPassword(refreshToken));
    updateUserMeta(userId, 'headless_auth_refresh_token_expiry', strval(time() + refreshExpiry));
    deleteTransient(`headless_auth_refresh_grace_${userId}`);

    const displayName: string = getTheAuthorMeta('display_name', userId);
    const email: string = getTheAuthorMeta('user_email', userId);
    const phone: string = getUserMeta(userId, 'phone_number', true);
    const capKey: string = `${wpdb.prefix}capabilities`;
    const caps: any = getUserMeta(userId, capKey, true);
    const roles: any = caps ? Object.keys(caps) : [];

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        name: displayName,
        email: email,
        phone: phone,
        roles: roles,
      },
    };
  }
}
