import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  private graphqlUrl = 'http://localhost:8030/graphql';

  constructor(private auth: AuthService) {}

  private async graphqlRequest(query: string) {
    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error('Error during GraphQL request');
    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    return result.data;
  }

  async getManagerInfo() {
    const query = `
      query {
        managerProfile {
          id
          name
          email
          department
          teams {
            id
            name
          }
        }
      }
    `;
    const data = await this.graphqlRequest(query);
    return data.managerProfile;
  }

  async updateManagerInfo(input: { name?: string; email?: string; department?: string }) {
    const query = `
      mutation {
        updateManager(input: { 
          name: "${input.name ?? ''}", 
          email: "${input.email ?? ''}", 
          department: "${input.department ?? ''}" 
        }) {
          id
          name
          email
          department
        }
      }
    `;
    const data = await this.graphqlRequest(query);
    return data.updateManager;
  }

  async getEmployees() {
    const query = `
      query {
        managerEmployees {
          id
          name
          email
          position
        }
      }
    `;
    const data = await this.graphqlRequest(query);
    return data.managerEmployees;
  }

  async addEmployee(input: { name: string; email: string; position: string }) {
    const query = `
      mutation {
        addEmployee(input: { 
          name: "${input.name}", 
          email: "${input.email}", 
          position: "${input.position}" 
        }) {
          id
          name
          email
        }
      }
    `;
    const data = await this.graphqlRequest(query);
    return data.addEmployee;
  }
}
