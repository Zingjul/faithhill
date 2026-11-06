"""
Shared DRF pagination.

DRF's PageNumberPagination supports `page_size` as a *query parameter* only when
`page_size_query_param` is set as a **class attribute** — there is no
`PAGE_SIZE_QUERY_PARAM` entry in DRF's settings, so it cannot be configured from
settings.py. This subclass is what makes `?page_size=100` work, which both the
staff dashboard (FK dropdowns) and the public site rely on.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200
