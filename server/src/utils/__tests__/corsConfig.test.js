const {
  getAllowedOrigins,
  isOriginAllowed,
  createOriginValidator,
  getCorsConfig,
  getSocketIOCorsConfig,
} = require("../corsConfig");

// Mock logger to avoid console output during tests
jest.mock("../logger", () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("CORS Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getAllowedOrigins", () => {
    it("should parse ALLOWED_ORIGINS environment variable", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";
      const origins = getAllowedOrigins();
      expect(origins).toEqual(["https://example.com", "https://test.com"]);
    });

    it("should trim whitespace from origins", () => {
      process.env.ALLOWED_ORIGINS = " https://example.com , https://test.com ";
      const origins = getAllowedOrigins();
      expect(origins).toEqual(["https://example.com", "https://test.com"]);
    });

    it("should fallback to CLIENT_URL if ALLOWED_ORIGINS is not set", () => {
      process.env.CLIENT_URL = "https://client.com";
      delete process.env.ALLOWED_ORIGINS;
      const origins = getAllowedOrigins();
      expect(origins).toEqual(["https://client.com"]);
    });

    it("should return production defaults in production environment", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.CLIENT_URL;
      const origins = getAllowedOrigins();
      expect(origins).toEqual(["https://d4media-erp.netlify.app"]);
    });

    it("should return development defaults in development environment", () => {
      process.env.NODE_ENV = "development";
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.CLIENT_URL;
      const origins = getAllowedOrigins();
      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://localhost:5173");
    });
  });

  describe("isOriginAllowed", () => {
    const allowedOrigins = ["https://example.com", "https://test.com"];

    it("should allow origins in the allowed list", () => {
      expect(isOriginAllowed("https://example.com", allowedOrigins)).toBe(true);
      expect(isOriginAllowed("https://test.com", allowedOrigins)).toBe(true);
    });

    it("should reject origins not in the allowed list", () => {
      expect(isOriginAllowed("https://malicious.com", allowedOrigins)).toBe(
        false
      );
    });

    it("should allow requests with no origin", () => {
      expect(isOriginAllowed(null, allowedOrigins)).toBe(true);
      expect(isOriginAllowed(undefined, allowedOrigins)).toBe(true);
    });
  });

  describe("createOriginValidator", () => {
    const allowedOrigins = ["https://example.com"];

    it("should create a validator function that allows valid origins", (done) => {
      const validator = createOriginValidator(allowedOrigins);
      validator("https://example.com", (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });

    it("should create a validator function that rejects invalid origins", (done) => {
      const validator = createOriginValidator(allowedOrigins);
      validator("https://malicious.com", (error, allowed) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Not allowed by CORS");
        done();
      });
    });

    it("should allow requests with no origin", (done) => {
      const validator = createOriginValidator(allowedOrigins);
      validator(null, (error, allowed) => {
        expect(error).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });
  });

  describe("getCorsConfig", () => {
    const allowedOrigins = ["https://example.com"];

    it("should return a valid CORS configuration object", () => {
      const config = getCorsConfig(allowedOrigins);

      expect(config).toHaveProperty("origin");
      expect(config).toHaveProperty("credentials", true);
      expect(config).toHaveProperty("methods");
      expect(config).toHaveProperty("allowedHeaders");
      expect(config).toHaveProperty("exposedHeaders");
      expect(config).toHaveProperty("optionsSuccessStatus", 200);
      expect(config).toHaveProperty("maxAge", 86400);
    });

    it("should include all necessary HTTP methods", () => {
      const config = getCorsConfig(allowedOrigins);
      const methods = config.methods;

      expect(methods).toContain("GET");
      expect(methods).toContain("POST");
      expect(methods).toContain("PUT");
      expect(methods).toContain("DELETE");
      expect(methods).toContain("PATCH");
      expect(methods).toContain("OPTIONS");
    });
  });

  describe("getSocketIOCorsConfig", () => {
    const allowedOrigins = ["https://example.com"];

    it("should return a valid Socket.IO CORS configuration", () => {
      const config = getSocketIOCorsConfig(allowedOrigins);

      expect(config).toHaveProperty("origin");
      expect(config).toHaveProperty("credentials", true);
      expect(config).toHaveProperty("methods");
      expect(config).toHaveProperty("allowedHeaders");
    });

    it("should include WebSocket-specific methods", () => {
      const config = getSocketIOCorsConfig(allowedOrigins);
      const methods = config.methods;

      expect(methods).toContain("GET");
      expect(methods).toContain("POST");
    });
  });
});
