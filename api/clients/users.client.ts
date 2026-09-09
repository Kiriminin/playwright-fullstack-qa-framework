import type { APIRequestContext, APIResponse } from "@playwright/test";
import type { RegisterUserPayload } from "../../test-data/user.factory";

export type RegisterUserRequest = Partial<RegisterUserPayload>;

export interface LoginUserPayload {
  email: string;
  password: string;
}

export class UsersClient {
  constructor(private readonly request: APIRequestContext) {}

  async register(user: RegisterUserRequest): Promise<APIResponse> {
    return this.request.post("/users/register", {
      data: user,
    });
  }

  async login(credentials: LoginUserPayload): Promise<APIResponse> {
    return this.request.post("/users/login", {
      data: credentials,
    });
  }
}