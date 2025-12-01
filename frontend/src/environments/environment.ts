export const environment = {
  production: false,
  GRAPHQL_ENDPOINT: (window as any).env?.GRAPHQL_ENDPOINT,
  AZURE_URL: (window as any).env?.AZURE_URL
};
