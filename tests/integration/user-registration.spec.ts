import { UsersClient } from "../../api/clients/users.client";
import {
  deleteUserById,
  findUserByEmail,
} from "../../db/queries/user.queries";
import { test, expect } from "../../fixtures/test.fixture";
import { LoginPage } from "../../pages/login.page";
import { userResponseSchema } from "../../schemas/user.schema";
import { createTestUser } from "../../test-data/user.factory";

test("@integration user registered through API can login through UI and exists in database", async ({
  request,
  db,
  page,
}) => {
  const userPayload = createTestUser();
  const usersClient = new UsersClient(request);

  let createdUserId: string | undefined;

  try {
    const response = await usersClient.register(userPayload);

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    createdUserId = responseBody.id;

    const apiUser = userResponseSchema.parse(responseBody);

    expect(apiUser.first_name).toBe(userPayload.first_name);
    expect(apiUser.last_name).toBe(userPayload.last_name);
    expect(apiUser.email).toBe(userPayload.email);

    const dbUser = await findUserByEmail(db, userPayload.email);

    expect(dbUser).toBeDefined();

    if (!dbUser) {
      throw new Error(
        `Registered user ${userPayload.email} was not found in the database`,
      );
    }

    expect(dbUser.id).toBe(apiUser.id);
    expect(dbUser.first_name).toBe(userPayload.first_name);
    expect(dbUser.last_name).toBe(userPayload.last_name);
    expect(dbUser.email).toBe(userPayload.email);

    expect(dbUser.street).toBe(userPayload.address.street);
    expect(dbUser.house_number).toBe(userPayload.address.house_number);
    expect(dbUser.city).toBe(userPayload.address.city);
    expect(dbUser.state).toBe(userPayload.address.state);
    expect(dbUser.country).toBe(userPayload.address.country);
    expect(dbUser.postal_code).toBe(userPayload.address.postal_code);

    expect(dbUser.phone).toBe(userPayload.phone);
    expect(dbUser.dob).toBe(userPayload.dob);
    expect(dbUser.role).toBe("user");
    expect(Boolean(dbUser.enabled)).toBe(true);
    expect(dbUser.failed_login_attempts).toBe(0);

    expect(dbUser.password).toBeTruthy();
    expect(dbUser.password).not.toBe(userPayload.password);

    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(userPayload.email, userPayload.password);

    await expect(page).toHaveURL(/\/account\/?$/);
    await expect(
      page.getByRole("heading", { name: "My account" }),
    ).toBeVisible();
  } finally {
    if (createdUserId) {
      await deleteUserById(db, createdUserId);
    }
  }
});

test("@integration duplicate email registration returns 409", async ({
  request,
  db,
}) => {
  const userPayload = createTestUser();
  const usersClient = new UsersClient(request);

  let createdUserId: string | undefined;

  try {
    const firstResponse = await usersClient.register(userPayload);

    expect(firstResponse.status()).toBe(201);

    const firstResponseBody = await firstResponse.json();
    const createdUser = userResponseSchema.parse(firstResponseBody);

    createdUserId = createdUser.id;

    const duplicateResponse = await usersClient.register(userPayload);

    expect(duplicateResponse.status()).toBe(409);
    expect(duplicateResponse.headers()["content-type"]).toContain(
      "application/json",
    );

    const dbUser = await findUserByEmail(db, userPayload.email);

    expect(dbUser).toBeDefined();
    expect(dbUser?.id).toBe(createdUser.id);
    expect(dbUser?.email).toBe(userPayload.email);
  } finally {
    if (createdUserId) {
      await deleteUserById(db, createdUserId);
    }
  }
});