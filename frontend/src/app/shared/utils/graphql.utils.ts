export type GraphqlError = {
  message: string;
  extensions?: {
    code?: string;
    classification?: string;
    [key: string]: unknown;
  };
};

export type GraphqlResponse<T> = {
  data: T;
  errors?: GraphqlError[];
};

const AUTH_ERROR_PATTERNS = [
  /forbidden/i,
  /unauthorized/i,
  /access.*denied/i,
  /requires.*auth/i,
  /requires .*admin/i,
  /requires .*manager/i,
];

const AUTH_ERROR_CODES = new Set(['FORBIDDEN', 'UNAUTHORIZED', 'ACCESS_DENIED', 'UNAUTHENTICATED', 'ACCESSDENIED']);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const looksLikeAuthorizationError = (error: GraphqlError): boolean => {
  if (!error) return false;
  if (AUTH_ERROR_PATTERNS.some((pattern) => pattern.test(error.message ?? ''))) {
    return true;
  }

  const extensions = error.extensions;
  if (!extensions || typeof extensions !== 'object') return false;

  const extensionRecord = extensions as Record<string, unknown>;
  const extensionValues = ['code', 'classification', 'errorType', 'error_code']
    .map((key) => extensionRecord[key])
    .filter(isNonEmptyString);

  return extensionValues.some((value) => AUTH_ERROR_CODES.has(value.toUpperCase()));
};

const isAuthorizationGraphqlResponse = (errors: GraphqlError[]): boolean =>
  errors.length > 0 && errors.every(looksLikeAuthorizationError);

export class GraphqlRequestError extends Error {
  public readonly isAuthorizationError: boolean;

  constructor(
    public readonly operationName: string | undefined,
    public readonly errors: GraphqlError[]
  ) {
    super(GraphqlRequestError.composeMessage(operationName, errors));
    this.name = 'GraphqlRequestError';
    this.isAuthorizationError = isAuthorizationGraphqlResponse(errors);
  }

  private static composeMessage(operationName: string | undefined, errors: GraphqlError[]): string {
    const prefix = `[GraphQL:${operationName ?? 'unknown'}]`;
    const message = errors
      .map((error) => error.message)
      .filter(isNonEmptyString)
      .join(', ');
    return `${prefix} ${message || 'Unexpected error'}`;
  }
}

export const isGraphqlAuthorizationError = (error: unknown): boolean =>
  error instanceof GraphqlRequestError && error.isAuthorizationError;
