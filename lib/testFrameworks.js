/**
 * Test Framework Definitions
 * Framework specifications with syntax samples and detection logic
 */

export const FRAMEWORK_LANGUAGES = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript/TypeScript',
    icon: 'Javascript',
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    packageFiles: ['package.json'],
    color: 'yellow'
  },
  python: {
    id: 'python',
    name: 'Python',
    icon: 'Python',
    extensions: ['.py'],
    packageFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    color: 'blue'
  },
  java: {
    id: 'java',
    name: 'Java',
    icon: 'Java',
    extensions: ['.java'],
    packageFiles: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    color: 'red'
  },
  csharp: {
    id: 'csharp',
    name: 'C#/.NET',
    icon: 'DotNet',
    extensions: ['.cs'],
    packageFiles: ['*.csproj', '*.sln'],
    color: 'purple'
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    icon: 'Ruby',
    extensions: ['.rb'],
    packageFiles: ['Gemfile'],
    color: 'red'
  },
  go: {
    id: 'go',
    name: 'Go',
    icon: 'Go',
    extensions: ['.go'],
    packageFiles: ['go.mod'],
    color: 'cyan'
  },
  php: {
    id: 'php',
    name: 'PHP',
    icon: 'Php',
    extensions: ['.php'],
    packageFiles: ['composer.json'],
    color: 'indigo'
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    icon: 'Rust',
    extensions: ['.rs'],
    packageFiles: ['Cargo.toml'],
    color: 'orange'
  }
};

export const TEST_TYPES = {
  unit: { id: 'unit', name: 'Unit Tests', icon: 'Box', description: 'Isolated component testing' },
  integration: { id: 'integration', name: 'Integration Tests', icon: 'Link', description: 'Component interaction testing' },
  e2e: { id: 'e2e', name: 'E2E Tests', icon: 'Globe', description: 'Full user flow testing' }
};

export const TEST_FRAMEWORKS = {
  // JavaScript/TypeScript - Unit
  jest: {
    id: 'jest',
    name: 'Jest',
    language: 'javascript',
    type: 'unit',
    icon: 'Jest',
    color: 'red',
    packageIndicator: { devDependencies: ['jest', '@types/jest', 'ts-jest'] },
    sample: `import { describe, test, expect, beforeEach, afterEach } from 'jest';

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should authenticate user with valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'ValidPass123' };

      // Act
      const result = await userService.login(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
      expect(result.token).toBeDefined();
    });

    test('should reject invalid password', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };

      // Act & Assert
      await expect(userService.login(credentials))
        .rejects.toThrow('Invalid credentials');
    });

    test('should handle rate limiting', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };

      // Act - attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await expect(userService.login(credentials)).rejects.toThrow();
      }

      // Assert - 6th attempt should be rate limited
      await expect(userService.login(credentials))
        .rejects.toThrow('Too many attempts');
    });
  });
});`,
    promptInstructions: `Generate Jest tests with this structure:

import { describe, test, expect, beforeEach, afterEach, jest } from 'jest';

describe('ComponentName', () => {
  describe('methodName', () => {
    test('should [expected behavior]', async () => {
      // Arrange - setup test data
      // Act - execute the action
      // Assert - verify results
    });
  });
});

Best Practices:
- Use describe() for grouping by component/method
- Use test() or it() for individual test cases
- Use beforeEach/afterEach for setup/teardown
- Use jest.mock() for mocking dependencies
- Use expect().toBe() for primitives
- Use expect().toEqual() for objects
- Use expect().toThrow() for error testing
- Use async/await for async tests
- Clear mocks in afterEach`
  },

  vitest: {
    id: 'vitest',
    name: 'Vitest',
    language: 'javascript',
    type: 'unit',
    icon: 'Vitest',
    color: 'green',
    packageIndicator: { devDependencies: ['vitest'] },
    sample: `import { describe, test, expect, beforeEach, vi } from 'vitest';
import { UserService } from './UserService';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  test('should authenticate with valid credentials', async () => {
    const result = await userService.login({
      email: 'test@example.com',
      password: 'ValidPass123'
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });

  test('should throw on invalid password', async () => {
    await expect(
      userService.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrowError('Invalid credentials');
  });
});`,
    promptInstructions: `Generate Vitest tests (similar to Jest):

import { describe, test, expect, beforeEach, vi } from 'vitest';

Key differences from Jest:
- Use vi.mock() instead of jest.mock()
- Use vi.fn() instead of jest.fn()
- Use vi.spyOn() instead of jest.spyOn()
- Native TypeScript support
- Faster execution`
  },

  mocha: {
    id: 'mocha',
    name: 'Mocha + Chai',
    language: 'javascript',
    type: 'unit',
    icon: 'Mocha',
    color: 'brown',
    packageIndicator: { devDependencies: ['mocha', 'chai'] },
    sample: `const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');
const UserService = require('./UserService');

describe('UserService', function() {
  let userService;

  before(function() {
    userService = new UserService();
  });

  describe('#login()', function() {
    it('should return user object on valid login', async function() {
      const result = await userService.login({
        email: 'test@example.com',
        password: 'ValidPass123'
      });

      expect(result).to.have.property('success', true);
      expect(result.user).to.have.property('email', 'test@example.com');
    });

    it('should throw error on invalid credentials', async function() {
      try {
        await userService.login({ email: 'test@example.com', password: 'wrong' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials');
      }
    });
  });
});`,
    promptInstructions: `Generate Mocha + Chai tests:

const { expect } = require('chai');
const { describe, it, before, after, beforeEach, afterEach } = require('mocha');

Chai Assertions:
- expect(value).to.equal(expected)
- expect(value).to.have.property('key', value)
- expect(array).to.include(item)
- expect(fn).to.throw(Error)
- expect(value).to.be.a('string')

Use function() not arrow functions for access to this context.`
  },

  // JavaScript E2E
  playwright: {
    id: 'playwright',
    name: 'Playwright',
    language: 'javascript',
    type: 'e2e',
    icon: 'Playwright',
    color: 'green',
    packageIndicator: { devDependencies: ['@playwright/test', 'playwright'] },
    sample: `import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'ValidPass123');
    await page.click('[data-testid="signin-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="signin-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]'))
      .toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="signin-button"]');

    await expect(page.locator('[data-testid="email-error"]'))
      .toHaveText('Email is required');
  });
});`,
    promptInstructions: `Generate Playwright E2E tests:

import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });

  test('should [behavior]', async ({ page }) => {
    // Actions
    await page.fill('selector', 'value');
    await page.click('selector');

    // Assertions
    await expect(page).toHaveURL(/pattern/);
    await expect(page.locator('selector')).toBeVisible();
    await expect(page.locator('selector')).toHaveText('text');
  });
});

Use data-testid attributes for selectors.
Use page.waitForSelector() for dynamic content.`
  },

  cypress: {
    id: 'cypress',
    name: 'Cypress',
    language: 'javascript',
    type: 'e2e',
    icon: 'Cypress',
    color: 'green',
    packageIndicator: { devDependencies: ['cypress'] },
    sample: `describe('User Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('ValidPass123');
    cy.get('[data-testid="signin-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="signin-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('contain', 'Invalid credentials');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="signin-button"]').click();
    cy.get('[data-testid="email-error"]')
      .should('contain', 'Email is required');
  });
});`,
    promptInstructions: `Generate Cypress E2E tests:

describe('Feature', () => {
  beforeEach(() => {
    cy.visit('/path');
  });

  it('should [behavior]', () => {
    // Actions (chainable)
    cy.get('selector').type('value');
    cy.get('selector').click();

    // Assertions
    cy.url().should('include', '/path');
    cy.get('selector').should('be.visible');
    cy.get('selector').should('contain', 'text');
  });
});

Cypress uses chainable commands.
Use cy.intercept() for API mocking.
Use data-testid for selectors.`
  },

  // Python
  pytest: {
    id: 'pytest',
    name: 'Pytest',
    language: 'python',
    type: 'unit',
    icon: 'Python',
    color: 'blue',
    packageIndicator: { requirements: ['pytest'] },
    sample: `import pytest
from user_service import UserService

class TestUserService:
    @pytest.fixture
    def user_service(self):
        return UserService()

    @pytest.fixture
    def valid_credentials(self):
        return {"email": "test@example.com", "password": "ValidPass123"}

    def test_login_with_valid_credentials(self, user_service, valid_credentials):
        """Should authenticate user with valid email and password."""
        result = user_service.login(**valid_credentials)

        assert result["success"] is True
        assert "user" in result
        assert result["user"]["email"] == valid_credentials["email"]

    def test_login_with_invalid_password(self, user_service):
        """Should raise error for invalid password."""
        with pytest.raises(AuthenticationError) as exc_info:
            user_service.login(email="test@example.com", password="wrong")

        assert "Invalid credentials" in str(exc_info.value)

    @pytest.mark.parametrize("email,password,expected_error", [
        ("", "ValidPass123", "Email is required"),
        ("test@example.com", "", "Password is required"),
        ("invalid-email", "ValidPass123", "Invalid email format"),
    ])
    def test_login_validation(self, user_service, email, password, expected_error):
        """Should validate input fields."""
        with pytest.raises(ValidationError) as exc_info:
            user_service.login(email=email, password=password)

        assert expected_error in str(exc_info.value)

    @pytest.mark.slow
    def test_rate_limiting(self, user_service):
        """Should block after 5 failed attempts."""
        for _ in range(5):
            with pytest.raises(AuthenticationError):
                user_service.login(email="test@example.com", password="wrong")

        with pytest.raises(RateLimitError):
            user_service.login(email="test@example.com", password="wrong")`,
    promptInstructions: `Generate Pytest tests:

import pytest

class TestClassName:
    @pytest.fixture
    def fixture_name(self):
        return setup_value

    def test_method_name(self, fixture_name):
        \"\"\"Docstring describes test purpose.\"\"\"
        # Arrange/Act/Assert
        assert condition

    @pytest.mark.parametrize("param1,param2,expected", [
        (value1, value2, expected1),
        (value3, value4, expected2),
    ])
    def test_with_params(self, param1, param2, expected):
        assert function(param1, param2) == expected

    def test_exception(self):
        with pytest.raises(ExceptionType) as exc_info:
            function_that_raises()
        assert "message" in str(exc_info.value)

Markers: @pytest.mark.slow, @pytest.mark.skip, @pytest.mark.xfail
Fixtures: @pytest.fixture(scope="module")`
  },

  // Java
  junit: {
    id: 'junit',
    name: 'JUnit 5',
    language: 'java',
    type: 'unit',
    icon: 'Java',
    color: 'red',
    packageIndicator: { maven: ['org.junit.jupiter:junit-jupiter'] },
    sample: `import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UserService Tests")
class UserServiceTest {
    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService();
    }

    @AfterEach
    void tearDown() {
        userService = null;
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {
        @Test
        @DisplayName("Should authenticate with valid credentials")
        void shouldAuthenticateWithValidCredentials() {
            // Arrange
            var credentials = new Credentials("test@example.com", "ValidPass123");

            // Act
            var result = userService.login(credentials);

            // Assert
            assertAll(
                () -> assertTrue(result.isSuccess()),
                () -> assertNotNull(result.getUser()),
                () -> assertEquals("test@example.com", result.getUser().getEmail())
            );
        }

        @Test
        @DisplayName("Should throw exception for invalid password")
        void shouldThrowForInvalidPassword() {
            var credentials = new Credentials("test@example.com", "wrong");

            var exception = assertThrows(AuthenticationException.class,
                () -> userService.login(credentials));

            assertEquals("Invalid credentials", exception.getMessage());
        }

        @ParameterizedTest
        @CsvSource({
            "'', ValidPass123, Email is required",
            "test@example.com, '', Password is required",
            "invalid, ValidPass123, Invalid email format"
        })
        @DisplayName("Should validate input fields")
        void shouldValidateInputFields(String email, String password, String expectedError) {
            var credentials = new Credentials(email, password);

            var exception = assertThrows(ValidationException.class,
                () -> userService.login(credentials));

            assertTrue(exception.getMessage().contains(expectedError));
        }
    }
}`,
    promptInstructions: `Generate JUnit 5 tests:

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Test Class Description")
class ClassNameTest {
    @BeforeEach
    void setUp() { }

    @Test
    @DisplayName("Should [behavior]")
    void shouldBehavior() {
        // Arrange/Act/Assert
        assertEquals(expected, actual);
        assertTrue(condition);
        assertNotNull(value);
    }

    @Nested
    @DisplayName("Grouped Tests")
    class NestedTests { }

    @ParameterizedTest
    @CsvSource({"input1, expected1", "input2, expected2"})
    void parameterizedTest(String input, String expected) { }
}

Assertions: assertEquals, assertTrue, assertThrows, assertAll
Annotations: @Test, @DisplayName, @Nested, @ParameterizedTest`
  },

  // .NET
  xunit: {
    id: 'xunit',
    name: 'xUnit',
    language: 'csharp',
    type: 'unit',
    icon: 'DotNet',
    color: 'purple',
    packageIndicator: { nuget: ['xunit'] },
    sample: `using Xunit;
using FluentAssertions;

public class UserServiceTests
{
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userService = new UserService();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnUser()
    {
        // Arrange
        var credentials = new Credentials("test@example.com", "ValidPass123");

        // Act
        var result = await _userService.LoginAsync(credentials);

        // Assert
        result.Success.Should().BeTrue();
        result.User.Should().NotBeNull();
        result.User.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldThrowException()
    {
        // Arrange
        var credentials = new Credentials("test@example.com", "wrong");

        // Act
        Func<Task> act = async () => await _userService.LoginAsync(credentials);

        // Assert
        await act.Should().ThrowAsync<AuthenticationException>()
            .WithMessage("Invalid credentials");
    }

    [Theory]
    [InlineData("", "ValidPass123", "Email is required")]
    [InlineData("test@example.com", "", "Password is required")]
    [InlineData("invalid", "ValidPass123", "Invalid email format")]
    public async Task Login_WithInvalidInput_ShouldValidate(
        string email, string password, string expectedError)
    {
        var credentials = new Credentials(email, password);

        Func<Task> act = async () => await _userService.LoginAsync(credentials);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage($"*{expectedError}*");
    }
}`,
    promptInstructions: `Generate xUnit tests with FluentAssertions:

using Xunit;
using FluentAssertions;

public class ClassNameTests
{
    [Fact]
    public void MethodName_Scenario_ExpectedBehavior()
    {
        // Arrange/Act/Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData(input1, expected1)]
    [InlineData(input2, expected2)]
    public void ParameterizedTest(type input, type expected) { }
}

FluentAssertions: .Should().Be(), .Should().BeTrue(), .Should().Throw<T>()
Naming: MethodName_Scenario_ExpectedBehavior`
  },

  // Ruby
  rspec: {
    id: 'rspec',
    name: 'RSpec',
    language: 'ruby',
    type: 'unit',
    icon: 'Ruby',
    color: 'red',
    packageIndicator: { gemfile: ['rspec'] },
    sample: `require 'rails_helper'

RSpec.describe UserService do
  let(:user_service) { described_class.new }
  let(:valid_credentials) { { email: 'test@example.com', password: 'ValidPass123' } }

  describe '#login' do
    context 'with valid credentials' do
      it 'authenticates the user' do
        result = user_service.login(**valid_credentials)

        expect(result[:success]).to be true
        expect(result[:user]).to be_present
        expect(result[:user][:email]).to eq 'test@example.com'
      end

      it 'returns a valid token' do
        result = user_service.login(**valid_credentials)

        expect(result[:token]).to match(/^[A-Za-z0-9_-]+$/)
      end
    end

    context 'with invalid password' do
      it 'raises an authentication error' do
        expect {
          user_service.login(email: 'test@example.com', password: 'wrong')
        }.to raise_error(AuthenticationError, 'Invalid credentials')
      end
    end

    context 'with missing fields' do
      it 'validates email presence' do
        expect {
          user_service.login(email: '', password: 'ValidPass123')
        }.to raise_error(ValidationError, /Email is required/)
      end
    end
  end
end`,
    promptInstructions: `Generate RSpec tests:

RSpec.describe ClassName do
  let(:instance) { described_class.new }

  describe '#method_name' do
    context 'when condition' do
      it 'does something' do
        expect(result).to eq expected
      end
    end
  end
end

Matchers: eq, be_truthy, be_present, include, match, raise_error
Use let for lazy-loaded fixtures
Use context for grouping by condition
Use subject for the object under test`
  },

  // Go
  gotest: {
    id: 'gotest',
    name: 'Go Test',
    language: 'go',
    type: 'unit',
    icon: 'Go',
    color: 'cyan',
    sample: `package auth

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestUserService_Login(t *testing.T) {
    service := NewUserService()

    t.Run("with valid credentials", func(t *testing.T) {
        result, err := service.Login("test@example.com", "ValidPass123")

        require.NoError(t, err)
        assert.True(t, result.Success)
        assert.Equal(t, "test@example.com", result.User.Email)
        assert.NotEmpty(t, result.Token)
    })

    t.Run("with invalid password", func(t *testing.T) {
        _, err := service.Login("test@example.com", "wrong")

        require.Error(t, err)
        assert.Contains(t, err.Error(), "Invalid credentials")
    })

    t.Run("validates required fields", func(t *testing.T) {
        testCases := []struct {
            name     string
            email    string
            password string
            wantErr  string
        }{
            {"empty email", "", "ValidPass123", "Email is required"},
            {"empty password", "test@example.com", "", "Password is required"},
            {"invalid email", "invalid", "ValidPass123", "Invalid email format"},
        }

        for _, tc := range testCases {
            t.Run(tc.name, func(t *testing.T) {
                _, err := service.Login(tc.email, tc.password)

                require.Error(t, err)
                assert.Contains(t, err.Error(), tc.wantErr)
            })
        }
    })
}`,
    promptInstructions: `Generate Go tests with testify:

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestFunctionName(t *testing.T) {
    t.Run("scenario description", func(t *testing.T) {
        // Arrange/Act/Assert
        assert.Equal(t, expected, actual)
        require.NoError(t, err)
    })
}

Table-driven tests for multiple cases.
Use t.Run() for subtests.
require.* for fatal assertions.
assert.* for non-fatal assertions.`
  },

  // PHP
  phpunit: {
    id: 'phpunit',
    name: 'PHPUnit',
    language: 'php',
    type: 'unit',
    icon: 'Php',
    color: 'indigo',
    sample: `<?php

namespace Tests\\Unit;

use PHPUnit\\Framework\\TestCase;
use App\\Services\\UserService;
use App\\Exceptions\\AuthenticationException;

class UserServiceTest extends TestCase
{
    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = new UserService();
    }

    public function test_login_with_valid_credentials_returns_user(): void
    {
        $result = $this->userService->login('test@example.com', 'ValidPass123');

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('user', $result);
        $this->assertEquals('test@example.com', $result['user']['email']);
    }

    public function test_login_with_invalid_password_throws_exception(): void
    {
        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('Invalid credentials');

        $this->userService->login('test@example.com', 'wrong');
    }

    /**
     * @dataProvider invalidInputProvider
     */
    public function test_login_validates_input(string $email, string $password, string $expectedError): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage($expectedError);

        $this->userService->login($email, $password);
    }

    public static function invalidInputProvider(): array
    {
        return [
            'empty email' => ['', 'ValidPass123', 'Email is required'],
            'empty password' => ['test@example.com', '', 'Password is required'],
            'invalid email' => ['invalid', 'ValidPass123', 'Invalid email format'],
        ];
    }
}`,
    promptInstructions: `Generate PHPUnit tests:

class ClassNameTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_method_name_scenario(): void
    {
        $this->assertEquals($expected, $actual);
        $this->assertTrue($condition);
    }

    /**
     * @dataProvider dataProviderName
     */
    public function test_with_data(params): void { }

    public static function dataProviderName(): array
    {
        return [
            'case name' => [param1, param2],
        ];
    }
}

Use @dataProvider for parameterized tests.
Naming: test_methodName_scenario`
  },

  // Generic
  generic: {
    id: 'generic',
    name: 'Generic (Given/When/Then)',
    language: 'any',
    type: 'unit',
    icon: 'Code',
    color: 'gray',
    sample: `## Test Case: TC-001 - Valid Login

### Description
Verify that a user can successfully log in with valid credentials.

### Priority: High
### Type: Functional

### Preconditions
- User account exists with email: test@example.com
- User account is active and not locked

### Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /login | Login page displays with email and password fields |
| 2 | Enter email: test@example.com | Email field shows entered value |
| 3 | Enter password: ValidPass123 | Password field shows masked characters |
| 4 | Click "Sign In" button | Loading indicator appears |
| 5 | Wait for response | Page redirects to /dashboard |

### Expected Result
- User is authenticated successfully
- Dashboard page displays
- Welcome message shows user's name
- Session token is created

### Tags
authentication, smoke, critical

---

## Test Case: TC-002 - Invalid Password

### Description
Verify that login fails with incorrect password.

### Priority: High
### Type: Negative

### Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /login | Login page displays |
| 2 | Enter email: test@example.com | Email accepted |
| 3 | Enter password: wrongpassword | Password accepted |
| 4 | Click "Sign In" | Error message displays |

### Expected Result
- Error message: "Invalid credentials"
- User remains on login page
- No session created`,
    promptInstructions: `Generate generic test cases in structured format:

## Test Case: TC-XXX - Title

### Description
Brief description of what this test verifies.

### Priority: High|Medium|Low
### Type: Functional|Negative|Security|Performance

### Preconditions
- Required setup conditions

### Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Action description | Expected outcome |

### Expected Result
- Final expected state

### Tags
comma, separated, tags

Use Given/When/Then format for step descriptions when appropriate.
Include both positive and negative test cases.`
  }
};

/**
 * Detect languages from file paths
 */
export function detectLanguagesFromFiles(filePaths) {
  const languages = new Set();

  for (const path of filePaths) {
    const ext = '.' + path.split('.').pop().toLowerCase();

    for (const [langId, lang] of Object.entries(FRAMEWORK_LANGUAGES)) {
      if (lang.extensions.includes(ext)) {
        languages.add(langId);
      }
    }
  }

  return Array.from(languages);
}

/**
 * Get frameworks for a language
 */
export function getFrameworksForLanguage(languageId) {
  return Object.values(TEST_FRAMEWORKS).filter(f => f.language === languageId || f.language === 'any');
}

/**
 * Get recommended frameworks based on file selection
 */
export function getRecommendedFrameworks(filePaths) {
  const languages = detectLanguagesFromFiles(filePaths);

  if (languages.length === 0) {
    return [TEST_FRAMEWORKS.generic];
  }

  const frameworks = [];
  for (const lang of languages) {
    frameworks.push(...getFrameworksForLanguage(lang));
  }

  return frameworks.length > 0 ? frameworks : [TEST_FRAMEWORKS.generic];
}

/**
 * Get framework by ID
 */
export function getFramework(frameworkId) {
  return TEST_FRAMEWORKS[frameworkId] || TEST_FRAMEWORKS.generic;
}
