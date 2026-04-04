/**
 * Pagination helper — adds LIMIT/OFFSET to queries.
 */
function buildPagination(params) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

/**
 * Wraps a list query with pagination metadata.
 */
function paginate(list, page, limit, total) {
  return {
    data: list,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { buildPagination, paginate };
