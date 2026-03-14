// Interface chuẩn cho response từ Backend NestJS
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginatedMeta;
}
