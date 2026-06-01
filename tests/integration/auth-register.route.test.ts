import { POST } from "@/app/api/auth/register/route";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const { prisma } = jest.requireMock("@/lib/prisma");

describe("register route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates user on valid payload", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "u1" });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        password: "Password1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("returns conflict when email exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        email: "alice@example.com",
        password: "Password1",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
