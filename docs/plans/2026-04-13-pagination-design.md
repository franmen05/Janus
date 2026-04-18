# Pagination Design — Customers, Operations, Exchange Rates, Ports, Users

## Summary

Add pagination to all list views. Server-side for high-volume entities (customers, operations, exchange rates). Client-side for low-volume entities (ports, users).

## Server-Side Pagination (A): Customers, Operations, Exchange Rates

### Backend

**Generic PageResponse DTO:**
```java
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
)
```

**Endpoint changes:**

| Endpoint | New Query Params | Search Fields |
|----------|-----------------|---------------|
| `GET /api/customers` | `page=0&size=10&search=term` | name, taxId, customerCode |
| `GET /api/operations` | `page=0&size=10&search=term` + existing (status, customerId) | referenceNumber, customer.name, blNumber |
| `GET /api/exchange-rates` | `page=0&size=10` | (none — just paginate) |

- Defaults: `page=0`, `size=10`
- Search uses LOWER + LIKE for case-insensitive matching
- Panache `find().page(Page.of(page, size))` for pagination

### Frontend

- Services pass `page`, `size`, `search` as HttpParams
- Components replace client-side filtering with server calls
- Debounced search input triggers server request

## Client-Side Pagination (B): Ports, Users

- No backend changes
- Frontend loads all data, paginates locally via array slice
- Same pagination UI component used

## Shared Frontend Component

**PaginationComponent** (shared):
- Inputs: `currentPage`, `totalPages`, `totalElements`
- Output: `pageChange` event
- Uses ngb-pagination from ng-bootstrap

## Functional Testing

After implementation, test all 5 list views with Playwright:
- Pagination navigation (next, prev, specific page)
- Search/filter + pagination interaction
- Empty state handling
- Verify data consistency across pages
