package org.iskcon.iys.shared.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Pagination wrapper returned alongside paginated data in API responses.
 *
 * <p>Usage in a controller:
 * <pre>
 *   Page&lt;DevoteeResponse&gt; page = devoteeService.list(centreId, pageable);
 *   return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
 * </pre>
 *
 * @param <T> the element type of this page
 */
@Getter
@Builder
public class PageResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean first;
    private final boolean last;

    /**
     * Builds a {@link PageResponse} from a Spring Data {@link Page}.
     */
    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
