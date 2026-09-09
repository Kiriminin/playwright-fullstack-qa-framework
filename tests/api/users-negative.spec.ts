import { UsersClient } from "../../api/clients/users.client";
import {
  deleteUserById,
  findUserByEmail,
} from "../../db/queries/user.queries";
import { test, expect } from "../../fixtures/test.fixture";
import {
  createTestUser,
  type RegisterUserPayload,
} from "../../test-data/user.factory";

interface InvalidRegistrationCase {
  name: string;
  buildPayload: (
    validPayload: RegisterUserPayload,
  ) => Partial<RegisterUserPayload>;
}

const invalidRegistrationCases: InvalidRegistrationCase[] = [
  {
    name: "email is missing",
    buildPayload: (payload) => {
      const { email: _email, ...payloadWithoutEmail } = payload;

      return payloadWithoutEmail;
    },
  },
  {
    name: "password is too weak",
    buildPayload: (payload) => ({
      ...payload,
      password: "123",
    }),
  },
  {
    name: "last name exceeds 20 characters",
    buildPayload: (payload) => ({
      ...payload,
      last_name: "A".repeat(21),
    }),
  },
];

test.describe("@api @negative user registration validation", () => {
  for (const registrationCase of invalidRegistrationCases) {
    test(`returns 422 when ${registrationCase.name}`, async ({ request }) => {
      const usersClient = new UsersClient(request);
      const validPayload = createTestUser();
      const invalidPayload =
        registrationCase.buildPayload(validPayload);

      const response = await usersClient.register(invalidPayload);

      expect(response.status()).toBe(422);
      expect(response.headers()["content-type"]).toContain(
        "application/json",
      );
    });
  }
});

test("@api @negative registration rejects invalid email format", async ({
  request,
  db,
}) => {
  const usersClient = new UsersClient(request);
  const validPayload = createTestUser();
  const invalidEmail = validPayload.email.replace("@", "");

  let createdUserId: string | undefined;

  try {
    const response = await usersClient.register({
      ...validPayload,
      email: invalidEmail,
    });

    if (response.status() === 201) {
      const responseBody = await response.json();
      createdUserId = responseBody.id;
    }

    test.fail(
      true,
      "Known backend defect: registration accepts an invalid email",
    );

    expect(response.status()).toBe(422);
  } finally {
    if (createdUserId) {
      await deleteUserById(db, createdUserId);
    }
  }
});

test("@api @negative newly registered user cannot login with incorrect password", async ({
  request,
  db,
}) => {
  const usersClient = new UsersClient(request);
  const userPayload = createTestUser();

  let createdUserId: string | undefined;

  try {
    const registrationResponse =
      await usersClient.register(userPayload);

    expect(registrationResponse.status()).toBe(201);

    const registeredUser = await registrationResponse.json();
    createdUserId = registeredUser.id;

    const loginResponse = await usersClient.login({
      email: userPayload.email,
      password: `${userPayload.password}Wrong`,
    });

    expect(loginResponse.status()).toBe(401);
    expect(loginResponse.headers()["content-type"]).toContain(
      "application/json",
    );

    const dbUser = await findUserByEmail(db, userPayload.email);

    expect(dbUser).toBeDefined();
  } finally {
    if (createdUserId) {
      await deleteUserById(db, createdUserId);
    }
  }
});