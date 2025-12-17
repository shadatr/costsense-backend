# CostSense Backend Tests

This directory contains comprehensive test suites for the CostSense backend API.

## Test Structure

```
tests/
├── setup.ts                    # Jest configuration and mocks
├── unit/                       # Unit tests for services
│   ├── inflation.service.test.ts
│   ├── deals.service.test.ts
│   └── tips.service.test.ts
└── integration/                # Integration tests for API endpoints
    ├── inflation.api.test.ts
    └── api-endpoints.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in CI mode (no watch)
```bash
npm run test:ci
```

### Run specific test file
```bash
npm test -- inflation.service.test.ts
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Coverage

### Unit Tests

#### InflationService (`tests/unit/inflation.service.test.ts`)
- ✅ Fetch Turkey inflation data
- ✅ Get historical inflation data
- ✅ Predict next months using linear regression
- ✅ Calculate budget impact
- ✅ Calculate category-specific inflation
- ✅ Store inflation data in database

#### DealsService (`tests/unit/deals.service.test.ts`)
- ✅ Scrape deals from multiple stores (Migros, BİM, Şok, A101)
- ✅ Find nearby deals within radius (Haversine distance calculation)
- ✅ Filter deals by category
- ✅ Track deals for users
- ✅ Get user saved deals
- ✅ Mark deals as used
- ✅ Store deals in database

#### TipsService (`tests/unit/tips.service.test.ts`)
- ✅ Get all active savings tips
- ✅ Generate personalized tips based on spending patterns
- ✅ Filter out dismissed tips
- ✅ Mark tips as viewed
- ✅ Submit tip feedback (helpful/not helpful)
- ✅ Dismiss tips
- ✅ Get tips by priority (HIGH, MEDIUM, LOW)
- ✅ Get tips by category (CRYPTO, RETAIL, BANKING, etc.)
- ✅ Track tip effectiveness (analytics)

### Integration Tests

#### Inflation API (`tests/integration/inflation.api.test.ts`)
- ✅ `GET /api/v1/inflation/current` - Public endpoint
- ✅ `GET /api/v1/inflation/history` - With authentication
- ✅ `GET /api/v1/inflation/forecast` - With authentication
- ✅ `POST /api/v1/inflation/impact` - Budget impact calculation
- ✅ `GET /api/v1/inflation/category/:categoryName` - Category rates
- ✅ Parameter validation (months, radius, etc.)
- ✅ Authentication checks

#### Deals & Tips API (`tests/integration/api-endpoints.test.ts`)
- ✅ `GET /api/v1/deals/nearby` - Location-based deals
- ✅ `GET /api/v1/deals/category/:categoryName` - Category filtering
- ✅ `POST /api/v1/deals/track` - Save deals
- ✅ `GET /api/v1/tips` - All tips with filtering
- ✅ `GET /api/v1/tips/personalized` - User-specific tips
- ✅ `POST /api/v1/tips/:tipId/feedback` - Submit feedback
- ✅ `POST /api/v1/tips/:tipId/view` - Mark as viewed
- ✅ `GET /api/v1/health` - Health check
- ✅ Error handling (404, 500, 401)

## Mocking Strategy

### Database Mocking
- Prisma Client is mocked in `tests/setup.ts`
- Each test file imports the mocked instance
- Mock data is reset between tests using `jest.clearAllMocks()`

### External API Mocking
- Axios is mocked for external API calls (TÜİK inflation data)
- Store scraping returns mock data in test environment

### Authentication Mocking
- Auth tokens are mocked with `Bearer test-token`
- Middleware bypassed for integration tests

## Test Data

### Mock Inflation Data
```json
{
  "currentRate": 64.8,
  "predictedRate": 67.2,
  "trend": "up",
  "lastUpdated": "2025-12-17T00:00:00.000Z",
  "categoryRates": {
    "food": 72.1,
    "housing": 62.5,
    "transport": 58.9,
    "healthcare": 54.7
  }
}
```

### Mock Deal Data
```json
{
  "id": "deal1",
  "product": "Olive oil (1L)",
  "store": "Migros",
  "oldPrice": 280,
  "newPrice": 210,
  "discount": 25,
  "location": { "lat": 41.0082, "lng": 28.9784 },
  "validUntil": "2025-12-31T00:00:00.000Z",
  "category": "Groceries"
}
```

### Mock Tip Data
```json
{
  "id": "tip1",
  "title": "Consider USDT for savings",
  "description": "Convert 20% of savings to stablecoins",
  "icon": "🪙",
  "priority": "HIGH",
  "category": "CRYPTO",
  "isActive": true
}
```

## Writing New Tests

### Unit Test Template
```typescript
import serviceUnderTest from '../../src/services/your.service'
import { prisma } from '../../src/config/database'

describe('YourService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const mockData = { /* ... */ }
      ;(prisma.model.method as jest.Mock).mockResolvedValue(mockData)

      // Act
      const result = await serviceUnderTest.methodName()

      // Assert
      expect(result).toBeDefined()
      expect(prisma.model.method).toHaveBeenCalled()
    })
  })
})
```

### Integration Test Template
```typescript
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/config/database'

describe('API Endpoint Tests', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = 'Bearer test-token'
  })

  describe('GET /api/v1/your-endpoint', () => {
    it('should return success response', async () => {
      const response = await request(app)
        .get('/api/v1/your-endpoint')
        .set('Authorization', authToken)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })
  })
})
```

## Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Mock External Dependencies**: Use Jest mocks for Prisma and Axios
3. **Test Edge Cases**: Include error scenarios and validation
4. **Clear Descriptions**: Use descriptive test names
5. **Clean Up**: Reset mocks between tests
6. **Isolated Tests**: Tests should not depend on each other
7. **Realistic Data**: Use data that matches production structure

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

CI command: `npm run test:ci`

## Troubleshooting

### Tests timing out
- Increase timeout in `jest.config.js` (default: 10000ms)
- Check for async operations without `await`

### Mocks not working
- Verify mocks are defined in `tests/setup.ts`
- Clear mocks with `jest.clearAllMocks()` in `beforeEach`

### Database connection errors
- Ensure test environment variables are set
- Check that Prisma is properly mocked

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

View coverage: `npm test -- --coverage && open coverage/lcov-report/index.html`

## Future Improvements

- [ ] E2E tests with real database (Docker)
- [ ] Load testing for high-traffic endpoints
- [ ] Contract testing for API versioning
- [ ] Mutation testing with Stryker
- [ ] Performance benchmarks
