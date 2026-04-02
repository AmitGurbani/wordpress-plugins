/**
 * JWT & Auth Infrastructure
 *
 * JWT generation helper, CORS handling, and JWT authentication filter.
 */

import { Action, Filter } from 'wpts';

class JwtAuth {
  // ── JWT Helper via WordPress Filter ───────────────────────────────────
  // Since wpts only includes decorated methods in generated PHP,
  // we use a WordPress filter as a reusable JWT generation function.

  @Action('init')
  registerJwtHelper(): void {
    addFilter(
      'hoa_generate_jwt',
      (value: string, userId: number, tokenType: string, expiry: number, secret: string) => {
        if (!secret) {
          return '';
        }
        const headerData: string = jsonEncode({ alg: 'HS256', typ: 'JWT' });
        const payloadData: string = jsonEncode({
          iss: siteUrl(),
          sub: userId,
          iat: time(),
          exp: time() + expiry,
          type: tokenType,
        });
        const b64Header: string = strtr(rtrim(base64Encode(headerData), '='), '+/', '-_');
        const b64Payload: string = strtr(rtrim(base64Encode(payloadData), '='), '+/', '-_');
        const headerPayload: string = b64Header + '.' + b64Payload;
        const signature: string = strtr(
          rtrim(base64Encode(hashHmac('sha256', headerPayload, secret, true)), '='),
          '+/',
          '-_',
        );
        return headerPayload + '.' + signature;
      },
      10,
      5,
    );
  }

  // ── CORS Headers ──────────────────────────────────────────────────────

  @Filter('rest_pre_serve_request')
  handleCors(served: boolean): boolean {
    const originsStr: string = getOption('headless_otp_auth_allowed_origins', '');
    if (!originsStr) {
      return served;
    }

    const headers: Record<string, string> = getallheaders();
    const origin: string = headers['Origin'] ?? '';
    if (!origin) {
      return served;
    }

    const allowedList: string[] = originsStr.split(',');
    let allowed: boolean = false;
    for (const allowedOrigin of allowedList) {
      if (allowedOrigin.trim() === origin) {
        allowed = true;
      }
    }

    if (allowed) {
      header('Access-Control-Allow-Origin: ' + origin);
      header('Access-Control-Allow-Headers: Authorization, Content-Type');
      header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
      header('Access-Control-Allow-Credentials: true');
    }

    return served;
  }

  // ── JWT Authentication Filter ─────────────────────────────────────────

  @Filter('determine_current_user', { priority: 20 })
  authenticateWithJwt(userId: number): number {
    const headers: Record<string, string> = getallheaders();
    const authHeader: string = $_SERVER['HTTP_AUTHORIZATION']
      ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
      ?? headers['Authorization']
      ?? headers['authorization']
      ?? '';
    if (!authHeader) {
      return userId;
    }

    const parts: string[] = authHeader.split(' ');
    if (parts.length !== 2) {
      return userId;
    }
    if (parts[0] !== 'Bearer') {
      return userId;
    }

    const token: string = parts[1];
    const secret: string = getOption('headless_otp_auth_jwt_secret_key', '');
    if (!secret) {
      return userId;
    }

    const tokenParts: string[] = token.split('.');
    if (tokenParts.length !== 3) {
      return userId;
    }

    // Verify signature
    const headerPayload: string = tokenParts[0] + '.' + tokenParts[1];
    const expectedSig: string = strtr(
      rtrim(base64Encode(hashHmac('sha256', headerPayload, secret, true)), '='),
      '+/',
      '-_',
    );

    if (!hashEquals(expectedSig, tokenParts[2])) {
      return userId;
    }

    // Decode and validate payload
    const payloadJson: string = base64Decode(strtr(tokenParts[1], '-_', '+/'));
    const payload: any = jsonDecode(payloadJson, true);

    if (!payload) {
      return userId;
    }
    if (payload['exp'] < time()) {
      return userId;
    }
    if (payload['iss'] !== siteUrl()) {
      return userId;
    }
    if (payload['type'] !== 'access') {
      return userId;
    }

    const tokenUserId: number = intval(payload['sub']);
    if (!tokenUserId || !getUserBy('id', tokenUserId)) {
      return userId;
    }

    wpSetCurrentUser(tokenUserId);
    $_SERVER['HOA_JWT_AUTHENTICATED'] = '1';
    return tokenUserId;
  }

  // ── Bypass cookie nonce check for JWT-authenticated requests ──────────
  // When JWT auth succeeded, tell the REST API this request is token-
  // authenticated (not cookies) so rest_cookie_check_errors (priority 100)
  // skips the nonce check.

  @Filter('rest_authentication_errors', { priority: 99 })
  allowJwtAuth(result: any): any {
    if (result) {
      return result;
    }

    if ($_SERVER['HOA_JWT_AUTHENTICATED'] === '1') {
      return true;
    }

    return result;
  }
}
