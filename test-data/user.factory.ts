import { faker } from "@faker-js/faker";

export interface RegisterUserPayload {
  first_name: string;
  last_name: string;
  address: {
    street: string;
    house_number: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  phone: string;
  dob: string;
  email: string;
  password: string;
}

export function createTestUser(): RegisterUserPayload {
  return {
    first_name: faker.person.firstName().slice(0, 40),
    last_name: faker.person.lastName().slice(0, 20),
    address: {
      street: faker.location.street().slice(0, 70),
      house_number: faker.number.int({ min: 1, max: 999 }).toString(),
      city: "Tbilisi",
      state: "Tbilisi",
      country: "Georgia",
      postal_code: "0100",
    },
    phone: `+9955${faker.number.int({
      min: 10000000,
      max: 99999999,
    })}`,
    dob: faker.date
      .birthdate({ min: 25, max: 55, mode: "age" })
      .toISOString()
      .slice(0, 10),
    email: `qa.${faker.string.uuid()}@example.com`,
    password: `Qa1!${faker.string.alphanumeric(12)}`,
  };
}