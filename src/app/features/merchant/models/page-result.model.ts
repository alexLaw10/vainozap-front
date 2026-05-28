/** Resposta paginada — espelha o {@code PageResult<T>} do backend. */
export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
