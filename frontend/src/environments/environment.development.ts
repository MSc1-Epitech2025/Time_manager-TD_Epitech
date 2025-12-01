export const environment = {
  production: true,
  GRAPHQL_ENDPOINT: (window as any).env?.GRAPHQL_ENDPOINT,
  AZURE_URL: (window as any).env?.AZURE_URL
};
