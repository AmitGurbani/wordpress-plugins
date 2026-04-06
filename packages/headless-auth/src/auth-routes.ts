/**
 * Auth Endpoints
 *
 * REST routes for user registration, token refresh, and profile retrieval.
 */

import { RestRoute } from 'wpts';

class AuthRoutes {
  @RestRoute('/auth/register', { method: 'POST', public: true })
  registerUser(request: any): any {
    const regToken: string = sanitizeTextField(request.get_param('registration_token'));
    const name: string = sanitizeTextField(request.get_param('name'));

    if (!regToken || !name) {
      return new WP_Error('missing_params', 'Registration token and name are required.', {
        status: 400,
      });
    }

    // Check if registration is enabled
    const regEnabled: string = getOption('headless_auth_enable_registration', '1');
    if (regEnabled !== '1') {
      return new WP_Error('registration_disabled', 'New user registration is disabled.', {
        status: 403,
      });
    }

    const regTokenHash: string = md5(regToken);
    const phone: string = getTransient(`ha_reg_${regTokenHash}`);

    if (!phone) {
      return new WP_Error('invalid_token', 'Registration token is invalid or expired.', {
        status: 400,
      });
    }

    // Check if user already exists (use fields:'ids' to avoid WP_User objects)
    let existingIds: any[] = getUsers({
      meta_key: 'phone_number',
      meta_value: phone,
      number: 1,
      fields: 'ids',
    });

    // Fallback: check WooCommerce billing_phone
    if (existingIds.length === 0 && classExists('WooCommerce')) {
      const wcIds: any[] = getUsers({
        meta_key: 'billing_phone',
        meta_value: phone,
        number: 1,
        fields: 'ids',
      });
      if (wcIds.length > 0) {
        updateUserMeta(intval(wcIds[0]), 'phone_number', phone);
        existingIds = wcIds;
      }
    }

    if (existingIds.length > 0) {
      deleteTransient(`ha_reg_${regTokenHash}`);
      return new WP_Error('user_exists', 'An account with this phone number already exists.', {
        status: 409,
      });
    }

    // Generate username from display name
    let baseUsername: string = sanitizeUser(strtolower(name).replace(' ', ''), true);
    if (!baseUsername) {
      baseUsername = 'user';
    }
    let username: string = baseUsername;
    if (usernameExists(username)) {
      const phoneSuffix: string = phone.length >= 4 ? phone.substring(phone.length - 4) : phone;
      username = baseUsername + phoneSuffix;
      let counter: number = 2;
      while (usernameExists(username)) {
        username = baseUsername + phoneSuffix + strval(counter);
        counter = counter + 1;
      }
    }

    const password: string = wpGeneratePassword(24, true, true);

    // Split name into first/last
    const nameParts: string[] = name.split(' ');
    const firstName: string = nameParts[0];
    const lastName: string = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const userRole: string = getOption('headless_auth_default_user_role', 'subscriber');

    const newUserId: any = wpInsertUser({
      user_login: username,
      user_pass: password,
      display_name: name,
      nickname: firstName,
      first_name: firstName,
      last_name: lastName,
      role: userRole,
    });

    if (isWpError(newUserId)) {
      return new WP_Error('registration_failed', 'Failed to create user account.', { status: 500 });
    }

    const userId: number = intval(newUserId);
    updateUserMeta(userId, 'phone_number', phone);
    if (classExists('WooCommerce')) {
      updateUserMeta(userId, 'billing_phone', phone);
      updateUserMeta(userId, 'billing_first_name', firstName);
      updateUserMeta(userId, 'billing_last_name', lastName);
    }
    deleteTransient(`ha_reg_${regTokenHash}`);

    // Generate tokens
    const secret: string = getOption('headless_auth_jwt_secret_key', '');
    if (!secret) {
      return new WP_Error('config_error', 'JWT is not configured.', { status: 403 });
    }
    const accessExpiry: number = intval(getOption('headless_auth_jwt_access_expiry', 3600));
    const refreshExpiry: number = intval(getOption('headless_auth_jwt_refresh_expiry', 604800));

    const accessToken: string = applyFilters(
      'ha_generate_jwt',
      '',
      userId,
      'access',
      accessExpiry,
      secret,
    );
    const refreshToken: string = applyFilters(
      'ha_generate_jwt',
      '',
      userId,
      'refresh',
      refreshExpiry,
      secret,
    );

    updateUserMeta(userId, 'ha_refresh_token_hash', wpHashPassword(refreshToken));
    updateUserMeta(userId, 'ha_refresh_token_expiry', strval(time() + refreshExpiry));

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        name: name,
        phone: phone,
      },
    };
  }

  @RestRoute('/auth/refresh', { method: 'POST', public: true })
  refreshToken(request: any): any {
    const refreshTokenStr: string = request.get_param('refresh_token');

    if (!refreshTokenStr) {
      return new WP_Error('missing_token', 'Refresh token is required.', { status: 400 });
    }

    const secret: string = getOption('headless_auth_jwt_secret_key', '');
    if (!secret) {
      return new WP_Error('config_error', 'JWT is not configured.', { status: 403 });
    }

    // Verify refresh token JWT
    const tokenParts: string[] = refreshTokenStr.split('.');
    if (tokenParts.length !== 3) {
      return new WP_Error('invalid_token', 'Invalid refresh token format.', { status: 400 });
    }

    const headerPayload: string = `${tokenParts[0]}.${tokenParts[1]}`;
    const expectedSig: string = strtr(
      rtrim(base64Encode(hashHmac('sha256', headerPayload, secret, true)), '='),
      '+/',
      '-_',
    );

    if (!hashEquals(expectedSig, tokenParts[2])) {
      return new WP_Error('invalid_token', 'Invalid refresh token.', { status: 401 });
    }

    const payloadJson: string = base64Decode(strtr(tokenParts[1], '-_', '+/'));
    const payload: any = jsonDecode(payloadJson, true);

    if (!payload || payload.type !== 'refresh') {
      return new WP_Error('invalid_token', 'Token is not a refresh token.', { status: 400 });
    }
    if (payload.exp < time()) {
      return new WP_Error('token_expired', 'Refresh token has expired.', { status: 401 });
    }
    if (payload.iss !== siteUrl()) {
      return new WP_Error('invalid_token', 'Token issuer mismatch.', { status: 401 });
    }

    const userId: number = intval(payload.sub);
    if (!userId) {
      return new WP_Error('invalid_token', 'Invalid user in token.', { status: 400 });
    }

    // Verify against stored hash
    const storedHash: string = getUserMeta(userId, 'ha_refresh_token_hash', true);
    if (!storedHash || !wpCheckPassword(refreshTokenStr, storedHash)) {
      return new WP_Error('invalid_token', 'Refresh token has been revoked.', { status: 401 });
    }

    const storedExpiry: number = intval(getUserMeta(userId, 'ha_refresh_token_expiry', true));
    if (storedExpiry < time()) {
      deleteUserMeta(userId, 'ha_refresh_token_hash');
      deleteUserMeta(userId, 'ha_refresh_token_expiry');
      return new WP_Error('token_expired', 'Refresh token has expired.', { status: 401 });
    }

    // Issue new tokens
    const accessExpiry: number = intval(getOption('headless_auth_jwt_access_expiry', 3600));
    const refreshExpiry: number = intval(getOption('headless_auth_jwt_refresh_expiry', 604800));

    const newAccessToken: string = applyFilters(
      'ha_generate_jwt',
      '',
      userId,
      'access',
      accessExpiry,
      secret,
    );
    const newRefreshToken: string = applyFilters(
      'ha_generate_jwt',
      '',
      userId,
      'refresh',
      refreshExpiry,
      secret,
    );

    updateUserMeta(userId, 'ha_refresh_token_hash', wpHashPassword(newRefreshToken));
    updateUserMeta(userId, 'ha_refresh_token_expiry', strval(time() + refreshExpiry));

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  @RestRoute('/auth/me', { method: 'GET', capability: 'read' })
  getProfile(_request: any): any {
    const userId: number = getCurrentUserId();

    if (!userId) {
      return new WP_Error('not_authenticated', 'You must be logged in.', { status: 401 });
    }

    const displayName: string = getTheAuthorMeta('display_name', userId);
    const phone: string = getUserMeta(userId, 'phone_number', true);

    return {
      id: userId,
      name: displayName,
      phone: phone,
    };
  }
}
