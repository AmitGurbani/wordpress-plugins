/**
 * OTP Endpoints
 *
 * REST routes for sending and verifying one-time passwords.
 */

import { RestRoute } from 'wpts';

class OtpRoutes {

  @RestRoute('/otp/send', { method: 'POST', public: true })
  sendOtp(request: any): any {
    const phone: string = sanitizeTextField(request.get_param('phone'));

    if (!phone) {
      return new WP_Error('missing_phone', 'Phone number is required.', { status: 400 });
    }

    // Rate limiting
    const phoneHash: string = md5(phone);
    const attemptsKey: string = 'hoa_attempts_' + phoneHash;
    const currentAttempts: any = getTransient(attemptsKey);
    const maxAttempts: number = Math.max(1, intval(getOption('headless_otp_auth_max_otp_attempts', 3)));

    if (currentAttempts && intval(currentAttempts) >= maxAttempts) {
      return new WP_Error('too_many_attempts', 'Too many OTP requests. Please try again later.', { status: 429 });
    }

    // Resend cooldown
    const cooldownKey: string = 'hoa_cooldown_' + phoneHash;
    const cooldownExpiry: any = getTransient(cooldownKey);
    if (cooldownExpiry) {
      const retryAfter: number = Math.max(0, intval(cooldownExpiry) - time());
      return new WP_Error('cooldown_active', 'Please wait before requesting another OTP.', { status: 429, retry_after: retryAfter });
    }

    // Generate OTP
    const otpLen: number = Math.max(4, intval(getOption('headless_otp_auth_otp_length', 6)));
    let otp: string = '';
    for (let i: number = 0; i < otpLen; i++) {
      otp = otp + strval(wpRand(0, 9));
    }

    // Store hashed OTP
    const otpExpiry: number = Math.max(60, intval(getOption('headless_otp_auth_otp_expiry', 300)));
    const otpHash: string = wpHashPassword(otp);
    setTransient('hoa_otp_' + phoneHash, otpHash, otpExpiry);

    // Update attempt count (use rate limit window, not OTP expiry)
    const rateLimitWindow: number = Math.max(60, intval(getOption('headless_otp_auth_rate_limit_window', 900)));
    const newAttempts: number = currentAttempts ? intval(currentAttempts) + 1 : 1;
    setTransient(attemptsKey, strval(newAttempts), rateLimitWindow);

    // Set resend cooldown
    const cooldown: number = Math.max(10, intval(getOption('headless_otp_auth_otp_resend_cooldown', 60)));
    setTransient(cooldownKey, strval(time() + cooldown), cooldown);

    // Test mode — skip external delivery, store OTP for admin display
    const testMode: string = getOption('headless_otp_auth_otp_test_mode', '');
    if (testMode === '1') {
      setTransient('hoa_test_otp_latest', jsonEncode({
        otp: otp,
        phone: phone,
        created_at: time(),
      }), otpExpiry);
      return { success: true, message: 'OTP generated in test mode.' };
    }

    // Validate OTP server is configured
    const serverUrl: string = getOption('headless_otp_auth_otp_server_url', '');
    if (!serverUrl) {
      return new WP_Error('otp_not_configured', 'OTP delivery is not configured.', { status: 500 });
    }

    // Send OTP via external server
    const apiKey: string = getOption('headless_otp_auth_otp_server_api_key', '');
    const response: any = wpRemotePost(serverUrl, {
      body: jsonEncode({ phone: phone, otp: otp }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      timeout: 15,
    });

    if (isWpError(response)) {
      return new WP_Error('otp_send_failed', 'Failed to send OTP.', { status: 500 });
    }

    const responseCode: number = intval(wpRemoteRetrieveResponseCode(response));
    if (responseCode < 200 || responseCode >= 300) {
      return new WP_Error('otp_send_failed', 'OTP delivery server returned an error.', { status: 502 });
    }

    return { success: true, message: 'OTP sent successfully.' };
  }

  @RestRoute('/otp/verify', { method: 'POST', public: true })
  verifyOtp(request: any): any {
    const phone: string = sanitizeTextField(request.get_param('phone'));
    const otp: string = sanitizeTextField(request.get_param('otp'));

    if (!phone || !otp) {
      return new WP_Error('missing_params', 'Phone number and OTP are required.', { status: 400 });
    }

    const phoneHash: string = md5(phone);
    const storedOtpHash: any = getTransient('hoa_otp_' + phoneHash);

    if (!storedOtpHash) {
      return new WP_Error('otp_expired', 'OTP has expired or was not requested.', { status: 400 });
    }

    // Brute-force protection: limit wrong verify attempts
    const verifyKey: string = 'hoa_verify_' + phoneHash;
    const verifyAttempts: any = getTransient(verifyKey);
    const maxVerify: number = Math.max(1, intval(getOption('headless_otp_auth_max_otp_verify_attempts', 3)));

    if (verifyAttempts && intval(verifyAttempts) >= maxVerify) {
      deleteTransient('hoa_otp_' + phoneHash);
      return new WP_Error('too_many_verify_attempts', 'Too many failed attempts. Please request a new OTP.', { status: 429 });
    }

    if (!wpCheckPassword(otp, storedOtpHash)) {
      const newVerify: number = verifyAttempts ? intval(verifyAttempts) + 1 : 1;
      const verifyExpiry: number = Math.max(60, intval(getOption('headless_otp_auth_rate_limit_window', 900)));
      setTransient(verifyKey, strval(newVerify), verifyExpiry);
      return new WP_Error('invalid_otp', 'Invalid OTP.', { status: 400 });
    }

    // OTP valid — clear transients
    deleteTransient('hoa_otp_' + phoneHash);
    deleteTransient('hoa_attempts_' + phoneHash);
    deleteTransient('hoa_verify_' + phoneHash);

    // Look up existing user by phone (use fields:'ids' to avoid WP_User objects)
    const userIds: any[] = getUsers({ meta_key: 'phone_number', meta_value: phone, number: 1, fields: 'ids' });

    if (userIds.length > 0) {
      const existingUserId: number = intval(userIds[0]);
      const secret: string = getOption('headless_otp_auth_jwt_secret_key', '');
      if (!secret) {
        return new WP_Error('config_error', 'JWT is not configured.', { status: 403 });
      }
      const accessExpiry: number = intval(getOption('headless_otp_auth_jwt_access_expiry', 3600));
      const refreshExpiry: number = intval(getOption('headless_otp_auth_jwt_refresh_expiry', 604800));

      const accessToken: string = applyFilters('hoa_generate_jwt', '', existingUserId, 'access', accessExpiry, secret);
      const refreshToken: string = applyFilters('hoa_generate_jwt', '', existingUserId, 'refresh', refreshExpiry, secret);

      updateUserMeta(existingUserId, 'hoa_refresh_token_hash', wpHashPassword(refreshToken));
      updateUserMeta(existingUserId, 'hoa_refresh_token_expiry', strval(time() + refreshExpiry));

      const displayName: string = getTheAuthorMeta('display_name', existingUserId);

      return {
        is_new_user: false,
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: existingUserId,
          name: displayName,
          phone: phone,
        },
      };
    }

    // New user — check if registration is enabled
    const regEnabled: string = getOption('headless_otp_auth_enable_registration', '1');
    if (regEnabled !== '1') {
      return {
        is_new_user: true,
        registration_disabled: true,
        message: 'New user registration is currently disabled.',
      };
    }

    // Generate registration token
    const regToken: string = wpGeneratePassword(32, false, false);
    const regTokenHash: string = md5(regToken);
    setTransient('hoa_reg_' + regTokenHash, phone, 600);

    return {
      is_new_user: true,
      registration_token: regToken,
    };
  }

  @RestRoute('/otp/test-otp', { method: 'GET', capability: 'manage_options' })
  getTestOtp(request: any): any {
    const testMode: string = getOption('headless_otp_auth_otp_test_mode', '');
    if (testMode !== '1') {
      return { test_mode: false };
    }

    const data: any = getTransient('hoa_test_otp_latest');
    if (!data) {
      return { test_mode: true, otp: null };
    }

    const parsed: any = jsonDecode(data, true);
    return {
      test_mode: true,
      otp: parsed['otp'],
      phone: parsed['phone'],
      created_at: parsed['created_at'],
    };
  }
}
