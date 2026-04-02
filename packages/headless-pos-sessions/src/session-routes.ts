/**
 * Session REST API Endpoints
 *
 * CRUD operations for POS sessions.
 * Namespace: headless-pos-sessions/v1
 */

import { RestRoute } from 'wpts';

class SessionRoutes {
  // ── Helper: format session post into API response ─────────────────────

  formatSession(postId: number): any {
    const post: any = getPost(postId, 'ARRAY_A');
    if (!post) {
      return null;
    }

    const orderIdsRaw: string = getPostMeta(postId, '_order_ids', true);

    return {
      id: postId,
      session_uuid: getPostMeta(postId, '_session_uuid', true),
      terminal_id: getPostMeta(postId, '_terminal_id', true),
      status: getPostMeta(postId, '_session_status', true),
      opened_at: getPostMeta(postId, '_opened_at', true),
      closed_at: getPostMeta(postId, '_closed_at', true),
      opening_balance: parseFloat(getPostMeta(postId, '_opening_balance', true)),
      closing_balance: parseFloat(getPostMeta(postId, '_closing_balance', true)),
      expected_balance: parseFloat(getPostMeta(postId, '_expected_balance', true)),
      cash_in: parseFloat(getPostMeta(postId, '_cash_in', true)),
      cash_out: parseFloat(getPostMeta(postId, '_cash_out', true)),
      order_count: intval(getPostMeta(postId, '_order_count', true)),
      order_ids: orderIdsRaw ? jsonDecode(orderIdsRaw, true) : [],
      notes: getPostMeta(postId, '_notes', true),
      cashier_id: intval(getPostMeta(postId, '_cashier_id', true)),
      created_at: post['post_date_gmt'],
    };
  }

  // ── POST /sessions — Create session ───────────────────────────────────

  @RestRoute('/sessions', { method: 'POST', capability: 'manage_shop_orders' })
  createSession(request: any): any {
    const uuid: string = sanitizeTextField(request.get_param('session_uuid'));
    if (!uuid) {
      return new WP_Error('missing_session_uuid', 'session_uuid is required.', { status: 400 });
    }

    const terminalId: string = sanitizeTextField(request.get_param('terminal_id'));
    if (!terminalId) {
      return new WP_Error('missing_terminal_id', 'terminal_id is required.', { status: 400 });
    }

    const openedAt: string = sanitizeTextField(request.get_param('opened_at'));
    if (!openedAt) {
      return new WP_Error('missing_opened_at', 'opened_at is required.', { status: 400 });
    }

    const openingBalance: number = parseFloat(request.get_param('opening_balance'));
    if (openingBalance < 0) {
      return new WP_Error('invalid_opening_balance', 'opening_balance must be >= 0.', { status: 400 });
    }

    // Validate order_ids format if provided
    const orderIdsParam: any = request.get_param('order_ids');
    if (orderIdsParam && !isArray(orderIdsParam)) {
      return new WP_Error('invalid_order_ids', 'order_ids must be an array of integers.', { status: 400 });
    }

    // Check duplicate UUID
    const existing: any[] = getPosts({
      post_type: 'pos_session',
      post_status: 'publish',
      meta_key: '_session_uuid',
      meta_value: uuid,
      posts_per_page: 1,
      fields: 'ids',
    });

    if (existing.length > 0) {
      return new WP_Error('duplicate_uuid', 'A session with this session_uuid already exists.', { status: 409 });
    }

    // Determine status
    const closedAt: string = sanitizeTextField(request.get_param('closed_at') || '');
    const status: string = closedAt ? 'closed' : 'open';

    // Check max open sessions limit
    if (status === 'open') {
      const maxOpen: number = Math.max(1, intval(getOption('headless_pos_sessions_max_open_sessions', 10)));
      const openSessions: any[] = getPosts({
        post_type: 'pos_session',
        post_status: 'publish',
        meta_key: '_session_status',
        meta_value: 'open',
        posts_per_page: -1,
        fields: 'ids',
      });
      if (openSessions.length >= maxOpen) {
        return new WP_Error('max_open_exceeded', 'Maximum number of open sessions reached.', { status: 409 });
      }
    }

    // Create post
    const postId: any = wpInsertPost({
      post_type: 'pos_session',
      post_title: 'POS Session \u2014 ' + openedAt,
      post_status: 'publish',
    });

    if (isWpError(postId)) {
      return new WP_Error('create_failed', 'Failed to create session.', { status: 500 });
    }

    const id: number = intval(postId);

    // Store meta
    updatePostMeta(id, '_session_uuid', uuid);
    updatePostMeta(id, '_terminal_id', terminalId);
    updatePostMeta(id, '_session_status', status);
    updatePostMeta(id, '_opened_at', openedAt);
    updatePostMeta(id, '_closed_at', closedAt);
    updatePostMeta(id, '_opening_balance', strval(openingBalance));
    updatePostMeta(id, '_closing_balance', sanitizeTextField(request.get_param('closing_balance') || '0'));
    updatePostMeta(id, '_expected_balance', sanitizeTextField(request.get_param('expected_balance') || '0'));
    updatePostMeta(id, '_cash_in', sanitizeTextField(request.get_param('cash_in') || '0'));
    updatePostMeta(id, '_cash_out', sanitizeTextField(request.get_param('cash_out') || '0'));
    updatePostMeta(id, '_order_count', strval(intval(request.get_param('order_count') || '0')));
    updatePostMeta(id, '_order_ids', orderIdsParam ? jsonEncode(orderIdsParam) : '[]');
    updatePostMeta(id, '_notes', sanitizeTextareaField(request.get_param('notes') || ''));

    const cashierId: number = intval(request.get_param('cashier_id') || '0');
    updatePostMeta(id, '_cashier_id', strval(cashierId > 0 ? cashierId : getCurrentUserId()));

    return this.formatSession(id);
  }

  // ── GET /sessions — List sessions ─────────────────────────────────────

  @RestRoute('/sessions', { method: 'GET', capability: 'manage_shop_orders' })
  listSessions(request: any): any {
    const perPage: number = Math.min(100, Math.max(1, intval(request.get_param('per_page') || '20')));
    const page: number = Math.max(1, intval(request.get_param('page') || '1'));
    const orderby: string = sanitizeTextField(request.get_param('orderby') || 'opened_at');
    const order: string = sanitizeTextField(request.get_param('order') || 'desc');
    const sortDir: string = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build query args
    const queryArgs: Record<string, any> = {
      post_type: 'pos_session',
      post_status: 'publish',
      posts_per_page: perPage,
      paged: page,
    };

    // Build meta_query
    const metaQuery: any[] = [];

    const statusFilter: string = sanitizeTextField(request.get_param('status') || '');
    if (statusFilter) {
      metaQuery.push({ key: '_session_status', value: statusFilter });
    }

    const terminalFilter: string = sanitizeTextField(request.get_param('terminal_id') || '');
    if (terminalFilter) {
      metaQuery.push({ key: '_terminal_id', value: terminalFilter });
    }

    const dateFrom: string = sanitizeTextField(request.get_param('date_from') || '');
    if (dateFrom) {
      metaQuery.push({ key: '_opened_at', value: dateFrom, compare: '>=', type: 'CHAR' });
    }

    const dateTo: string = sanitizeTextField(request.get_param('date_to') || '');
    if (dateTo) {
      metaQuery.push({ key: '_opened_at', value: dateTo, compare: '<=', type: 'CHAR' });
    }

    if (metaQuery.length > 0) {
      queryArgs['meta_query'] = metaQuery;
    }

    // Sorting
    if (orderby === 'order_count') {
      queryArgs['meta_key'] = '_order_count';
      queryArgs['orderby'] = 'meta_value_num';
    } else if (orderby === 'closed_at') {
      queryArgs['meta_key'] = '_closed_at';
      queryArgs['orderby'] = 'meta_value';
    } else {
      queryArgs['meta_key'] = '_opened_at';
      queryArgs['orderby'] = 'meta_value';
    }
    queryArgs['order'] = sortDir;

    // Get IDs for the current page
    queryArgs['fields'] = 'ids';
    const postIds: any[] = getPosts(queryArgs);

    const sessions: any[] = [];
    for (const pid of postIds) {
      const session: any = this.formatSession(intval(pid));
      if (session) {
        sessions.push(session);
      }
    }

    // Total count for pagination (all matching IDs, no pagination)
    const countArgs: Record<string, any> = {
      post_type: 'pos_session',
      post_status: 'publish',
      posts_per_page: -1,
      fields: 'ids',
    };
    if (metaQuery.length > 0) {
      countArgs['meta_query'] = metaQuery;
    }
    const allIds: any[] = getPosts(countArgs);
    const total: number = allIds.length;
    const totalPages: number = Math.max(1, Math.ceil(total / perPage));

    return {
      data: sessions,
      meta: {
        total: total,
        total_pages: totalPages,
        page: page,
        per_page: perPage,
      },
    };
  }

  // ── GET /sessions/:id — Get single session ────────────────────────────

  @RestRoute('/sessions/(?P<id>\\d+)', { method: 'GET', capability: 'manage_shop_orders' })
  getSession(request: any): any {
    const postId: number = intval(request.get_param('id'));
    const post: any = getPost(postId);

    if (!post || getPostType(postId) !== 'pos_session') {
      return new WP_Error('not_found', 'Session not found.', { status: 404 });
    }

    return this.formatSession(postId);
  }

  // ── PUT /sessions/:id — Update session (partial) ──────────────────────

  @RestRoute('/sessions/(?P<id>\\d+)', { method: 'PUT', capability: 'manage_shop_orders' })
  updateSession(request: any): any {
    const postId: number = intval(request.get_param('id'));
    const post: any = getPost(postId);

    if (!post || getPostType(postId) !== 'pos_session') {
      return new WP_Error('not_found', 'Session not found.', { status: 404 });
    }

    const params: any = request.get_json_params();

    if (params['terminal_id'] !== undefined) {
      updatePostMeta(postId, '_terminal_id', sanitizeTextField(params['terminal_id']));
    }
    if (params['status'] !== undefined) {
      const newStatus: string = sanitizeTextField(params['status']);
      if (newStatus === 'open') {
        const currentStatus: string = getPostMeta(postId, '_session_status', true);
        if (currentStatus !== 'open') {
          const maxOpen: number = Math.max(1, intval(getOption('headless_pos_sessions_max_open_sessions', 10)));
          const openSessions: any[] = getPosts({
            post_type: 'pos_session',
            post_status: 'publish',
            meta_key: '_session_status',
            meta_value: 'open',
            posts_per_page: -1,
            fields: 'ids',
          });
          if (openSessions.length >= maxOpen) {
            return new WP_Error('max_open_exceeded', 'Maximum number of open sessions reached.', { status: 409 });
          }
        }
      }
      updatePostMeta(postId, '_session_status', newStatus);
    }
    if (params['opened_at'] !== undefined) {
      updatePostMeta(postId, '_opened_at', sanitizeTextField(params['opened_at']));
    }
    if (params['closed_at'] !== undefined) {
      updatePostMeta(postId, '_closed_at', sanitizeTextField(params['closed_at']));
    }
    if (params['opening_balance'] !== undefined) {
      updatePostMeta(postId, '_opening_balance', strval(parseFloat(params['opening_balance'])));
    }
    if (params['closing_balance'] !== undefined) {
      updatePostMeta(postId, '_closing_balance', strval(parseFloat(params['closing_balance'])));
    }
    if (params['expected_balance'] !== undefined) {
      updatePostMeta(postId, '_expected_balance', strval(parseFloat(params['expected_balance'])));
    }
    if (params['cash_in'] !== undefined) {
      updatePostMeta(postId, '_cash_in', strval(parseFloat(params['cash_in'])));
    }
    if (params['cash_out'] !== undefined) {
      updatePostMeta(postId, '_cash_out', strval(parseFloat(params['cash_out'])));
    }
    if (params['order_ids'] !== undefined) {
      updatePostMeta(postId, '_order_ids', jsonEncode(params['order_ids']));
    }
    if (params['order_count'] !== undefined) {
      updatePostMeta(postId, '_order_count', strval(intval(params['order_count'])));
    }
    if (params['notes'] !== undefined) {
      updatePostMeta(postId, '_notes', sanitizeTextareaField(params['notes']));
    }
    if (params['cashier_id'] !== undefined) {
      updatePostMeta(postId, '_cashier_id', strval(intval(params['cashier_id'])));
    }

    return this.formatSession(postId);
  }

  // ── DELETE /sessions/:id — Delete session ─────────────────────────────

  @RestRoute('/sessions/(?P<id>\\d+)', { method: 'DELETE', capability: 'manage_woocommerce' })
  deleteSession(request: any): any {
    const postId: number = intval(request.get_param('id'));
    const post: any = getPost(postId);

    if (!post || getPostType(postId) !== 'pos_session') {
      return new WP_Error('not_found', 'Session not found.', { status: 404 });
    }

    const result: any = wpDeletePost(postId, true);
    if (!result) {
      return new WP_Error('delete_failed', 'Failed to delete session.', { status: 500 });
    }

    return { deleted: true, id: postId };
  }
}
