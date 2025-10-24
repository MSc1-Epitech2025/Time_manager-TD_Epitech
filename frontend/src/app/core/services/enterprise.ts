// src/app/core/manager.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  private graphqlUrl = 'http://localhost:8030/graphql';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private async graphqlRequest(query: string) {
    const token = await this.auth.ensureValidAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error('Erreur lors de la requête GraphQL');
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
