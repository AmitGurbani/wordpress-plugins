/**
 * Auth Endpoints
 *
 * REST routes for user registration, token refresh, and profile retrieval.
 */

import { RestRoute } from '@amitgurbani/wpts';

class AuthRoutes {
  @RestRoute('/auth/register', { method: 'POST', public: true })
  registerUser(request: any): any {
    const regToken: string = sanitizeTextField(request.get_param('registration_token'));
    const name: string = sanitizeTextField(request.get_param('name'));

    if (!regToken || !name) {
      return new WP_Error(
        'missing_params',
        __('Registration token and name are required.', 'headless-auth'),
        {
          status: 400,
        },
      );
    }

    // Check if registration is enabled
    const regEnabled: string = getOption('headless_auth_enable_registration', '1');
    if (regEnabled !== '1') {
      return new WP_Error(
        'registration_disabled',
        __('New user registration is disabled.', 'headless-auth'),
        {
          status: 403,
        },
      );
    }

    const regTokenHash: string = md5(regToken);
    const phone: string = getTransient(`headless_auth_reg_${regTokenHash}`);

    if (!phone) {
      return new WP_Error(
        'invalid_token',
        __('Registration token is invalid or expired.', 'headless-auth'),
        {
          status: 400,
        },
      );
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
      deleteTransient(`headless_auth_reg_${regTokenHash}`);
      return new WP_Error(
        'user_exists',
        __('An account with this phone number already exists.', 'headless-auth'),
        {
          status: 409,
        },
      );
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
      return new WP_Error(
        'registration_failed',
        __('Failed to create user account.', 'headless-auth'),
        { status: 500 },
      );
    }

    const userId: number = intval(newUserId);
    updateUserMeta(userId, 'phone_number', phone);
    if (classExists('WooCommerce')) {
      updateUserMeta(userId, 'billing_phone', phone);
      updateUserMeta(userId, 'billing_first_name', firstName);
      updateUserMeta(userId, 'billing_last_name', lastName);
    }
    deleteTransient(`headless_auth_reg_${regTokenHash}`);

    // Generate tokens
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

    const email: string = getTheAuthorMeta('user_email', userId);
    const capKey: string = `${wpdb.prefix}capabilities`;
    const caps: any = getUserMeta(userId, capKey, true);
    const roles: any = caps ? Object.keys(caps) : [];

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        name: name,
        email: email,
        phone: phone,
        roles: roles,
      },
    };
  }

  @RestRoute('/auth/refresh', { method: 'POST', public: true })
  refreshToken(request: any): any {
    const refreshTokenStr: string = request.get_param('refresh_token');

    if (!refreshTokenStr) {
      return new WP_Error('missing_token', __('Refresh token is required.', 'headless-auth'), {
        status: 400,
      });
    }

    const secret: string = getOption('headless_auth_jwt_secret_key', '');
    if (!secret) {
      return new WP_Error('config_error', __('JWT is not configured.', 'headless-auth'), {
        status: 403,
      });
    }

    // Verify refresh token JWT
    const tokenParts: string[] = refreshTokenStr.split('.');
    if (tokenParts.length !== 3) {
      return new WP_Error('invalid_token', __('Invalid refresh token format.', 'headless-auth'), {
        status: 400,
      });
    }

    const headerPayload: string = `${tokenParts[0]}.${tokenParts[1]}`;
    const expectedSig: string = strtr(
      rtrim(base64Encode(hashHmac('sha256', headerPayload, secret, true)), '='),
      '+/',
      '-_',
    );

    if (!hashEquals(expectedSig, tokenParts[2])) {
      return new WP_Error('invalid_token', __('Invalid refresh token.', 'headless-auth'), {
        status: 401,
      });
    }

    const payloadJson: string = base64Decode(strtr(tokenParts[1], '-_', '+/'));
    const payload: any = jsonDecode(payloadJson, true);

    if (!payload || payload.type !== 'refresh') {
      return new WP_Error('invalid_token', __('Token is not a refresh token.', 'headless-auth'), {
        status: 400,
      });
    }
    if (payload.exp < time()) {
      return new WP_Error('token_expired', __('Refresh token has expired.', 'headless-auth'), {
        status: 401,
      });
    }
    if (payload.iss !== siteUrl()) {
      return new WP_Error('invalid_token', __('Token issuer mismatch.', 'headless-auth'), {
        status: 401,
      });
    }

    const userId: number = intval(payload.sub);
    if (!userId) {
      return new WP_Error('invalid_token', __('Invalid user in token.', 'headless-auth'), {
        status: 400,
      });
    }

    // Verify against stored hash
    const storedHash: string = getUserMeta(userId, 'headless_auth_refresh_token_hash', true);
    const hashMatches: boolean = !!(storedHash && wpCheckPassword(refreshTokenStr, storedHash));

    if (!hashMatches) {
      // Grace period: if the token was recently rotated, allow idempotent reuse
      // and return the same response (Auth0/Okta pattern, 30s window).
      const graceData: any = getTransient(`headless_auth_refresh_grace_${userId}`);
      if (graceData) {
        const grace: any = jsonDecode(graceData, true);
        if (grace && grace.prev_hash && wpCheckPassword(refreshTokenStr, grace.prev_hash)) {
          return {
            access_token: grace.access_token,
            refresh_token: grace.refresh_token,
          };
        }
      }
      return new WP_Error('invalid_token', __('Refresh token has been revoked.', 'headless-auth'), {
        status: 401,
      });
    }

    const storedExpiry: number = intval(
      getUserMeta(userId, 'headless_auth_refresh_token_expiry', true),
    );
    if (storedExpiry < time()) {
      deleteUserMeta(userId, 'headless_auth_refresh_token_hash');
      deleteUserMeta(userId, 'headless_auth_refresh_token_expiry');
      return new WP_Error('token_expired', __('Refresh token has expired.', 'headless-auth'), {
        status: 401,
      });
    }

    // Issue new tokens
    const accessExpiry: number = intval(getOption('headless_auth_jwt_access_expiry', 3600));
    const refreshExpiry: number = intval(getOption('headless_auth_jwt_refresh_expiry', 604800));

    const newAccessToken: string = applyFilters(
      'headless_auth_generate_jwt',
      '',
      userId,
      'access',
      accessExpiry,
      secret,
    );
    const newRefreshToken: string = applyFilters(
      'headless_auth_generate_jwt',
      '',
      userId,
      'refresh',
      refreshExpiry,
      secret,
    );

    updateUserMeta(userId, 'headless_auth_refresh_token_hash', wpHashPassword(newRefreshToken));
    updateUserMeta(userId, 'headless_auth_refresh_token_expiry', strval(time() + refreshExpiry));

    // Cache response for grace period (30s) — allows idempotent reuse of the
    // old refresh token by concurrent requests (e.g. multiple browser tabs).
    setTransient(
      `headless_auth_refresh_grace_${userId}`,
      jsonEncode({
        prev_hash: storedHash,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      }),
      30,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  @RestRoute('/auth/me', { method: 'GET', capability: 'read' })
  getProfile(_request: any): any {
    const userId: number = getCurrentUserId();

    if (!userId) {
      return new WP_Error('not_authenticated', __('You must be logged in.', 'headless-auth'), {
        status: 401,
      });
    }

    const displayName: string = getTheAuthorMeta('display_name', userId);
    const email: string = getTheAuthorMeta('user_email', userId);
    const firstName: string = getTheAuthorMeta('first_name', userId);
    const lastName: string = getTheAuthorMeta('last_name', userId);
    const phone: string = getUserMeta(userId, 'phone_number', true);
    const capKey: string = `${wpdb.prefix}capabilities`;
    const caps: any = getUserMeta(userId, capKey, true);
    const roles: any = caps ? Object.keys(caps) : [];

    return {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      name: displayName,
      email: email,
      phone: phone,
      roles: roles,
    };
  }

  @RestRoute('/auth/me', { method: 'PUT', capability: 'read' })
  updateProfile(request: any): any {
    const userId: number = getCurrentUserId();

    if (!userId) {
      return new WP_Error('not_authenticated', __('You must be logged in.', 'headless-auth'), {
        status: 401,
      });
    }

    // Defense-in-depth: edit_user meta capability allows self-editing via map_meta_cap()
    if (!currentUserCan('edit_user', userId)) {
      return new WP_Error(
        'cannot_edit',
        __('You are not allowed to edit this profile.', 'headless-auth'),
        {
          status: 403,
        },
      );
    }

    // Read optional fields from request (profile data only — credential changes
    // like email/phone require re-authentication and are handled separately)
    const rawName: string = request.get_param('name');
    const rawFirstName: string = request.get_param('first_name');
    const rawLastName: string = request.get_param('last_name');

    // Build wp_update_user data
    const userData: any = { ID: userId };
    let hasCoreUpdates: boolean = false;

    // -- Display name --
    if (rawName) {
      const name: string = sanitizeTextField(rawName);
      if (name) {
        userData.display_name = name;
        hasCoreUpdates = true;
      }
    }

    // -- First name --
    if (rawFirstName) {
      const firstName: string = sanitizeTextField(rawFirstName);
      if (firstName) {
        userData.first_name = firstName;
        hasCoreUpdates = true;
      }
    }

    // -- Last name --
    if (rawLastName) {
      const lastName: string = sanitizeTextField(rawLastName);
      if (lastName) {
        userData.last_name = lastName;
        hasCoreUpdates = true;
      }
    }

    if (!hasCoreUpdates) {
      return new WP_Error(
        'no_changes',
        __('No valid fields provided for update.', 'headless-auth'),
        { status: 400 },
      );
    }

    // Update core WP user fields
    const result: any = wpUpdateUser(userData);
    if (isWpError(result)) {
      return new WP_Error('update_failed', __('Failed to update profile.', 'headless-auth'), {
        status: 500,
      });
    }

    // Sync WooCommerce billing name meta
    if (classExists('WooCommerce')) {
      if (userData.first_name !== undefined) {
        updateUserMeta(userId, 'billing_first_name', userData.first_name);
      }
      if (userData.last_name !== undefined) {
        updateUserMeta(userId, 'billing_last_name', userData.last_name);
      }
    }

    // Return updated profile (same shape as GET /auth/me)
    const displayName: string = getTheAuthorMeta('display_name', userId);
    const emailOut: string = getTheAuthorMeta('user_email', userId);
    const firstNameOut: string = getTheAuthorMeta('first_name', userId);
    const lastNameOut: string = getTheAuthorMeta('last_name', userId);
    const phone: string = getUserMeta(userId, 'phone_number', true);
    const capKey: string = `${wpdb.prefix}capabilities`;
    const caps: any = getUserMeta(userId, capKey, true);
    const roles: any = caps ? Object.keys(caps) : [];

    return {
      id: userId,
      first_name: firstNameOut,
      last_name: lastNameOut,
      name: displayName,
      email: emailOut,
      phone: phone,
      roles: roles,
    };
  }
}
