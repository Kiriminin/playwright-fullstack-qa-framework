# Playwright Full-Stack QA Framework

[![Playwright Full-Stack Tests](https://github.com/Kiriminin/playwright-fullstack-qa-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/Kiriminin/playwright-fullstack-qa-framework/actions/workflows/playwright.yml)

A full-stack test automation framework built with Playwright and TypeScript.

The project demonstrates automated testing across three application layers:

- UI testing in Chromium, Firefox, and WebKit
- REST API testing
- Direct database validation
- API → Database integration testing
- API → UI → Database end-to-end workflows
- Runtime response validation with Zod
- Dynamic test data generation with Faker
- Automated cleanup of test data
- Continuous integration with GitHub Actions and Docker

## Application Under Test

The framework tests the open-source [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) application.

The application source code is not included in this repository. GitHub Actions checks it out separately and starts it using Docker Compose.

## Technology Stack

- TypeScript
- Playwright Test
- Zod
- Faker
- MySQL / MariaDB
- mysql2
- Docker Compose
- GitHub Actions

## Project Structure

```text
playwright-fullstack-qa-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── api/
│   └── clients/
│       ├── products.client.ts
│       └── users.client.ts
├── config/
│   └── env.ts
├── db/
│   ├── connection.ts
│   └── queries/
│       ├── product.queries.ts
│       └── user.queries.ts
├── fixtures/
│   └── test.fixture.ts
├── pages/
│   └── login.page.ts
├── schemas/
│   ├── product.schema.ts
│   └── user.schema.ts
├── test-data/
│   └── user.factory.ts
├── tests/
│   ├── api/
│   │   ├── products-api.spec.ts
│   │   └── users-negative.spec.ts
│   ├── integration/
│   │   ├── database-health.spec.ts
│   │   ├── product-api-db.spec.ts
│   │   └── user-registration.spec.ts
│   └── ui/
│       └── app-health.spec.ts
├── .env.example
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Test Coverage

### UI tests

- Verify that the application home page opens successfully
- Validate the page title
- Run UI tests across Chromium, Firefox, and WebKit

### API tests

- Validate the products catalog response
- Validate HTTP status codes and content types
- Validate response bodies using Zod schemas
- Verify user registration validation
- Verify duplicate user registration
- Verify login rejection with an incorrect password

### Database tests

- Verify that seeded products exist
- Query MariaDB directly using a reusable Playwright fixture
- Compare product data returned by the API with the database record
- Verify that a registered user is persisted correctly
- Verify that passwords are stored as hashes
- Clean up dynamically created test users

### Full-stack integration

The main integration scenario validates a complete flow:

1. Generate unique user data with Faker
2. Register the user through the REST API
3. Validate the API response
4. Find and validate the user in MariaDB
5. Log in through the UI with the same credentials
6. Verify successful authorization
7. Delete the created user during test cleanup

## Product Catalog Coverage

### API tests

* Verify price sorting in ascending and descending order.
* Verify filtering by brand and category.
* Verify that returned prices stay within the requested range.
* Verify pagination metadata and ensure the first two pages contain no overlapping product IDs.

### API and database integration

* Use SQL results as an independent reference for brand and category filters.
* Compare the complete product ID set across all API pages with matching non-rental products in MariaDB.
* Detect missing, unexpected, or duplicate products.
* Verify API totals and pagination metadata against the database result count.

### UI tests

* Select ascending and descending price sorting through the catalog interface.
* Verify the selected sorting option and the order of displayed prices.
* Run both scenarios in Chromium, Firefox, and WebKit.

UI sorting assertions cover base prices displayed on the current catalog page.

### Reusable components

* Typed filtering, sorting, and pagination options in `ProductsClient`.
* Parameterized catalog queries for database validation.
* A `ProductsPage` Page Object for catalog interactions.

## Shopping Cart Coverage

### API tests

- Create an empty cart.
- Add products and verify quantities and prices.
- Add the same product again without creating duplicate cart items.
- Increase and decrease quantities through the update endpoint.
- Remove individual products and empty the cart.
- Reject zero, negative, fractional, and above-limit quantities.
- Verify that rejected requests leave the cart unchanged.

### API and database integration

- Compare API responses with MariaDB records throughout the cart lifecycle.
- Verify stored quantities after adding, updating, and removing products.
- Use parameterized SQL queries for database checks.

### UI integration

- Open an API-created cart in Chromium.
- Verify unit price, line total, and cart total for a product without discounts.
- Change quantity through the UI and verify the database record.
- Verify that the updated quantity survives a page reload.
- Remove the product through the UI and verify the empty cart through API and SQL.

### Test isolation

Each cart test creates its own cart. A reusable Playwright fixture automatically
deletes the cart during teardown, including when the test fails.

## Known Backend Defect

The registration API currently accepts an invalid email format and returns `201 Created`.

The corresponding test is marked with Playwright's `test.fail()` as a known backend defect. If the backend validation is fixed, the test will report an unexpected pass and indicate that the expected-failure marker should be removed.

## Prerequisites

- Node.js 22 or newer
- npm
- Docker Desktop
- Git

## Local Setup

Clone the automation framework and the application under test into the same parent directory:

```bash
git clone https://github.com/Kiriminin/playwright-fullstack-qa-framework.git
git clone https://github.com/testsmith-io/practice-software-testing.git
```

Install the framework dependencies:

```bash
cd playwright-fullstack-qa-framework
npm ci
npx playwright install
```

Create a local environment file.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Start the application:

```bash
cd ../practice-software-testing
docker compose -f docker-compose.yml up -d
docker exec pst-laravel-api-1 php artisan migrate:fresh --seed
```

Return to the automation framework:

```bash
cd ../playwright-fullstack-qa-framework
npm test
```

If port `3306` is already occupied locally, change the database mapping in the application's Docker Compose configuration and set the same host port in `.env`.

Example:

```env
DB_PORT=3307
```

## Available Commands

| Command | Description |
|---|---|
| `npm test` | Run the complete test suite |
| `npm run test:ui` | Run UI tests in Chromium |
| `npm run test:ui:all` | Run UI tests in all configured browsers |
| `npm run test:api` | Run API tests |
| `npm run test:integration` | Run API, UI, and database integration tests |
| `npm run test:smoke` | Run tests tagged with `@smoke` |
| `npm run test:headed` | Run Chromium UI tests in headed mode |
| `npm run test:debug` | Run Chromium UI tests in debug mode |
| `npm run typecheck` | Run the TypeScript compiler check |
| `npm run report` | Open the latest Playwright HTML report |

## Continuous Integration

GitHub Actions automatically:

1. Checks out the automation framework
2. Checks out the application under test
3. Installs Node.js dependencies and Playwright browsers
4. Starts the application and database with Docker Compose
5. Runs database migrations and seeders
6. Waits for UI, API, and database readiness
7. Runs the complete Playwright test suite
8. Uploads the HTML report as a workflow artifact
9. Prints application logs if the run fails
10. Stops and removes the Docker environment

## Author

Kyryl Zubkov — QA Engineer