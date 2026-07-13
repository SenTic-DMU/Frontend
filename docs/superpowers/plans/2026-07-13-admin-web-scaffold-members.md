# 관리자 웹 스캐폴딩 + 회원관리 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `C:\Users\yume1\Documents\GitHub\sentic-admin`에 신규 Vite 웹 프로젝트를 스캐폴딩하고, 관리자 로그인 + 회원관리(목록/검색/상세/상태 토글/결제내역) 기능을 낙관적 업데이트를 포함해 끝까지 완성한다.

**Architecture:** Vite + React 19 + TypeScript SPA. `features/<domain>` 폴더에 api/hooks/types를 묶고, `components/common`에 도메인 간 재사용 UI를, `components/ui`에 최소 프리미티브(Button/Input)를 둔다. TanStack Query로 서버 상태를 캐싱하고, 회원 상태 토글은 낙관적 업데이트 + 롤백으로 구현한다. React Router v6로 `/login`(공개)과 `ProtectedRoute` 하위의 `/members`, `/members/:memberId`를 라우팅한다.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Query v5, React Router v6, axios, clsx, tailwind-merge, Vitest, @testing-library/react, @testing-library/user-event, jsdom.

## Global Constraints

- 백엔드 API 베이스 URL은 `VITE_API_BASE_URL` 환경 변수로 주입한다.
- 회원 상태 값은 정확히 `"ACTIVE"` / `"INACTIVE"` 두 가지만 사용한다.
- 결제 상태 값은 정확히 `"PENDING"` / `"SUCCESS"` / `"FAILED"` / `"CANCELLED"` 네 가지만 사용한다.
- 관리자 액세스 토큰은 `localStorage` 키 `admin_access_token`에, 관리자 프로필은 키 `admin_user`에 저장한다.
- 모든 HTTP 호출은 각 도메인의 `features/<domain>/api.ts`에만 존재해야 한다 (실제 백엔드 확정 시 이 파일들만 교체).
- 테스트는 Vitest + @testing-library/react + jsdom로 작성하고 `npm test`로 실행한다.
- 이 계획은 공지사항/FAQ/결제 페이지는 다루지 않는다 (스펙의 향후 범위). 회원 상세 페이지의 "결제 내역" 섹션에 필요한 최소 payments 데이터 레이어만 포함한다.

---

## Task 1: 프로젝트 스캐폴딩 (Vite + Tailwind + Vitest)

**Files:**
- Create: `sentic-admin/package.json` (via `npm create vite`)
- Modify: `sentic-admin/vite.config.ts`
- Modify: `sentic-admin/src/index.css`
- Create: `sentic-admin/src/lib/utils.ts`
- Test: `sentic-admin/src/lib/utils.test.ts`
- Create: `sentic-admin/src/test/setup.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` — 이후 모든 UI 컴포넌트가 className 병합에 사용.

- [ ] **Step 1: Vite 프로젝트 생성**

```bash
cd "C:/Users/yume1/Documents/GitHub" && npm create vite@latest sentic-admin -- --template react-ts
```

Expected: `sentic-admin/` 폴더가 생성되고 `package.json`, `src/App.tsx` 등 기본 템플릿 파일이 존재.

- [ ] **Step 2: 런타임 의존성 설치**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm install react-router-dom @tanstack/react-query axios clsx tailwind-merge
```

- [ ] **Step 3: Tailwind CSS v4 설치 및 설정**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm install -D tailwindcss @tailwindcss/vite
```

`sentic-admin/vite.config.ts`를 아래로 교체:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`sentic-admin/src/index.css` 내용을 아래로 교체:

```css
@import "tailwindcss";
```

- [ ] **Step 4: 개발 서버 기동 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm run dev -- --port 5183 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5183
kill %1
```

Expected: `200` 출력.

- [ ] **Step 5: 테스트 도구 설치**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

`sentic-admin/vite.config.ts`를 아래로 교체 (vitest 설정 포함):

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `sentic-admin/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`sentic-admin/package.json`의 `scripts`에 아래 두 줄 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: cn() 헬퍼 작성 (실패하는 테스트부터)**

Create `sentic-admin/src/lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", undefined, "font-medium")).toBe("text-sm font-medium");
  });
});
```

- [ ] **Step 7: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- utils.test.ts
```

Expected: FAIL — `Cannot find module './utils'`.

- [ ] **Step 8: cn() 구현**

Create `sentic-admin/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- utils.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 10: 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && git init && git add -A && git commit -m "chore: scaffold vite project with tailwind and vitest"
```

---

## Task 2: API 클라이언트 + Query 클라이언트

**Files:**
- Create: `sentic-admin/src/lib/apiClient.ts`
- Test: `sentic-admin/src/lib/apiClient.test.ts`
- Create: `sentic-admin/src/lib/queryClient.ts`

**Interfaces:**
- Consumes: 없음 (axios, TanStack Query 라이브러리만 사용)
- Produces: `apiClient` (axios 인스턴스, 모든 `features/*/api.ts`가 사용), `attachAuthHeader`, `handleAuthError`, `queryClient` (TanStack `QueryClient` 인스턴스, `App.tsx`가 사용)

- [ ] **Step 1: apiClient 실패하는 테스트 작성**

Create `sentic-admin/src/lib/apiClient.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { attachAuthHeader, handleAuthError } from "./apiClient";

describe("attachAuthHeader", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches the Authorization header when a token exists", () => {
    localStorage.setItem("admin_access_token", "test-token");
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = attachAuthHeader(config);
    expect(result.headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("does not attach a header when no token exists", () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = attachAuthHeader(config);
    expect(result.headers.get("Authorization")).toBeUndefined();
  });
});

describe("handleAuthError", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears the token and redirects on a 401 response", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 401 } } as AxiosError;
    await expect(handleAuthError(error, redirect)).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBeNull();
    expect(redirect).toHaveBeenCalled();
  });

  it("keeps the token and does not redirect for non-401 errors", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 500 } } as AxiosError;
    await expect(handleAuthError(error, redirect)).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBe("test-token");
    expect(redirect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- apiClient.test.ts
```

Expected: FAIL — `Cannot find module './apiClient'`.

- [ ] **Step 3: apiClient 구현**

Create `sentic-admin/src/lib/apiClient.ts`:

```ts
import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";

const TOKEN_STORAGE_KEY = "admin_access_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export function attachAuthHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

export function handleAuthError(
  error: AxiosError,
  redirect: () => void = () => {
    window.location.href = "/login";
  }
): Promise<never> {
  if (error.response?.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    redirect();
  }
  return Promise.reject(error);
}

apiClient.interceptors.request.use(attachAuthHeader);
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleAuthError(error)
);
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- apiClient.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: queryClient 작성 (정적 설정, 테스트 불필요)**

Create `sentic-admin/src/lib/queryClient.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

- [ ] **Step 6: 전체 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 7: 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && git add -A && git commit -m "feat: add api client with auth interceptors and query client"
```

---

## Task 3: 인증 (로그인 + ProtectedRoute)

**Files:**
- Create: `sentic-admin/src/features/auth/types.ts`
- Create: `sentic-admin/src/features/auth/api.ts`
- Test: `sentic-admin/src/features/auth/AuthContext.test.tsx`
- Create: `sentic-admin/src/features/auth/AuthContext.tsx`
- Create: `sentic-admin/src/components/ui/button.tsx`
- Create: `sentic-admin/src/components/ui/input.tsx`
- Test: `sentic-admin/src/components/layout/ProtectedRoute.test.tsx`
- Create: `sentic-admin/src/components/layout/ProtectedRoute.tsx`
- Test: `sentic-admin/src/pages/login/LoginPage.test.tsx`
- Create: `sentic-admin/src/pages/login/LoginPage.tsx`

**Interfaces:**
- Consumes: `apiClient` (Task 2), `cn` (Task 1)
- Produces: `AuthProvider`, `useAuth(): { admin, isAuthenticated, login, logout }` (Task 4+에서 라우팅에 사용), `ProtectedRoute` (Task 10 라우터가 사용), `LoginPage` (Task 10 라우터가 사용), `Button`, `Input` (이후 폼에서 재사용)

- [ ] **Step 1: 타입 정의**

Create `sentic-admin/src/features/auth/types.ts`:

```ts
export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}
```

- [ ] **Step 2: 로그인 API 함수**

Create `sentic-admin/src/features/auth/api.ts`:

```ts
import { apiClient } from "../../lib/apiClient";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/admin/auth/login",
    payload
  );
  return data;
}
```

- [ ] **Step 3: AuthContext 실패하는 테스트 작성**

Create `sentic-admin/src/features/auth/AuthContext.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "./api";

vi.mock("./api");

function TestConsumer() {
  const { admin, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? `logged-in:${admin?.email}` : "logged-out"}</p>
      <button onClick={() => login("admin@sentic.com", "password")}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("logs in and stores the admin user", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: { id: "1", email: "admin@sentic.com", name: "Admin" },
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText("logged-out")).toBeInTheDocument();
    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged-in:admin@sentic.com")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBe("token-123");
  });

  it("logs out and clears storage", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: { id: "1", email: "admin@sentic.com", name: "Admin" },
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));
    await waitFor(() => screen.getByText("logged-in:admin@sentic.com"));

    await user.click(screen.getByText("logout"));
    expect(screen.getByText("logged-out")).toBeInTheDocument();
    expect(localStorage.getItem("admin_access_token")).toBeNull();
  });
});
```

- [ ] **Step 4: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- AuthContext.test.tsx
```

Expected: FAIL — `Cannot find module './AuthContext'`.

- [ ] **Step 5: AuthContext 구현**

Create `sentic-admin/src/features/auth/AuthContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "./api";
import type { AdminUser } from "./types";

const TOKEN_STORAGE_KEY = "admin_access_token";
const ADMIN_STORAGE_KEY = "admin_user";

interface AuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, [admin]);

  async function login(email: string, password: string) {
    const response = await loginRequest({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    setAdmin(response.admin);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAdmin(null);
  }

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, login, logout }),
    [admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- AuthContext.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 7: UI 프리미티브 작성 (Button, Input)**

Create `sentic-admin/src/components/ui/button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-slate-900 text-white hover:bg-slate-700",
          variant === "outline" &&
            "border border-slate-300 bg-white hover:bg-slate-100",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

Create `sentic-admin/src/components/ui/input.tsx`:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
```

- [ ] **Step 8: ProtectedRoute 실패하는 테스트 작성**

Create `sentic-admin/src/components/layout/ProtectedRoute.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthProvider } from "../../features/auth/AuthContext";

function renderWithAuth(isLoggedIn: boolean) {
  localStorage.clear();
  if (isLoggedIn) {
    localStorage.setItem(
      "admin_user",
      JSON.stringify({ id: "1", email: "a@b.com", name: "A" })
    );
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/members"]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/members" element={<p>members page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", () => {
    renderWithAuth(false);
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the nested route when authenticated", () => {
    renderWithAuth(true);
    expect(screen.getByText("members page")).toBeInTheDocument();
  });
});
```

- [ ] **Step 9: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- ProtectedRoute.test.tsx
```

Expected: FAIL — `Cannot find module './ProtectedRoute'`.

- [ ] **Step 10: ProtectedRoute 구현**

Create `sentic-admin/src/components/layout/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
```

- [ ] **Step 11: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- ProtectedRoute.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 12: LoginPage 실패하는 테스트 작성**

Create `sentic-admin/src/pages/login/LoginPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../../features/auth/AuthContext";
import * as api from "../../features/auth/api";

vi.mock("../../features/auth/api");

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/members" element={<p>members page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("navigates to /members after a successful login", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: { id: "1", email: "admin@sentic.com", name: "Admin" },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("이메일"), "admin@sentic.com");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByText("members page")).toBeInTheDocument();
    });
  });

  it("shows an error message when login fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("unauthorized"));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("이메일"), "admin@sentic.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(
        screen.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 13: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- LoginPage.test.tsx
```

Expected: FAIL — `Cannot find module './LoginPage'`.

- [ ] **Step 14: LoginPage 구현**

Create `sentic-admin/src/pages/login/LoginPage.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/members", { replace: true });
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold">관리자 로그인</h1>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 15: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- LoginPage.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 16: 전체 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test
git add -A && git commit -m "feat: add authentication (login page, auth context, protected route)"
```

---

## Task 4: AdminLayout + Sidebar

**Files:**
- Test: `sentic-admin/src/components/layout/Sidebar.test.tsx`
- Create: `sentic-admin/src/components/layout/Sidebar.tsx`
- Test: `sentic-admin/src/components/layout/AdminLayout.test.tsx`
- Create: `sentic-admin/src/components/layout/AdminLayout.tsx`

**Interfaces:**
- Consumes: `react-router-dom`의 `NavLink`, `Outlet`
- Produces: `AdminLayout` (Task 10 라우터가 사용)

- [ ] **Step 1: Sidebar 실패하는 테스트 작성**

Create `sentic-admin/src/components/layout/Sidebar.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders the members navigation link", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "회원관리" })).toHaveAttribute(
      "href",
      "/members"
    );
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- Sidebar.test.tsx
```

Expected: FAIL — `Cannot find module './Sidebar'`.

- [ ] **Step 3: Sidebar 구현**

Create `sentic-admin/src/components/layout/Sidebar.tsx`:

```tsx
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [{ to: "/members", label: "회원관리" }];

export function Sidebar() {
  return (
    <nav className="w-56 shrink-0 border-r bg-white p-4">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- Sidebar.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: AdminLayout 실패하는 테스트 작성**

Create `sentic-admin/src/components/layout/AdminLayout.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

describe("AdminLayout", () => {
  it("renders the sidebar and the nested route content", () => {
    render(
      <MemoryRouter initialEntries={["/members"]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/members" element={<p>members content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "회원관리" })).toBeInTheDocument();
    expect(screen.getByText("members content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- AdminLayout.test.tsx
```

Expected: FAIL — `Cannot find module './AdminLayout'`.

- [ ] **Step 7: AdminLayout 구현**

Create `sentic-admin/src/components/layout/AdminLayout.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 8: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- AdminLayout.test.tsx
npm test
git add -A && git commit -m "feat: add admin layout with sidebar navigation"
```

---

## Task 5: 공통 테이블 컴포넌트 (DataTable, Pagination)

**Files:**
- Test: `sentic-admin/src/components/common/DataTable.test.tsx`
- Create: `sentic-admin/src/components/common/DataTable.tsx`
- Test: `sentic-admin/src/components/common/Pagination.test.tsx`
- Create: `sentic-admin/src/components/common/Pagination.tsx`

**Interfaces:**
- Produces: `DataTable<T>({ columns, data, rowKey, emptyMessage? })`, `DataTableColumn<T>` 타입, `Pagination({ page, totalPages, onPageChange })` — Task 9/10의 회원 페이지들이 사용. `page`는 0부터 시작.

- [ ] **Step 1: DataTable 실패하는 테스트 작성**

Create `sentic-admin/src/components/common/DataTable.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
];

describe("DataTable", () => {
  it("renders a row for each item", () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { id: "1", name: "Alice" },
          { id: "2", name: "Bob" },
        ]}
        rowKey={(row) => row.id}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders the empty message when there is no data", () => {
    render(<DataTable columns={columns} data={[]} rowKey={(row) => row.id} />);
    expect(screen.getByText("데이터가 없습니다.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- DataTable.test.tsx
```

Expected: FAIL — `Cannot find module './DataTable'`.

- [ ] **Step 3: DataTable 구현**

Create `sentic-admin/src/components/common/DataTable.tsx`:

```tsx
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "데이터가 없습니다.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-slate-500">
          {columns.map((column) => (
            <th key={column.key} className="px-3 py-2 font-medium">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={rowKey(row)}
            className="border-b last:border-0 hover:bg-slate-50"
          >
            {columns.map((column) => (
              <td key={column.key} className="px-3 py-2">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- DataTable.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Pagination 실패하는 테스트 작성**

Create `sentic-admin/src/components/common/Pagination.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination page={0} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables the previous button on the first page", () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음" })).not.toBeDisabled();
  });

  it("calls onPageChange with the next page number", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={1} totalPages={3} onPageChange={onPageChange} />
    );
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- Pagination.test.tsx
```

Expected: FAIL — `Cannot find module './Pagination'`.

- [ ] **Step 7: Pagination 구현**

Create `sentic-admin/src/components/common/Pagination.tsx`:

```tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm disabled:opacity-40"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </button>
      <span className="text-sm text-slate-600">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm disabled:opacity-40"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}
```

- [ ] **Step 8: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- Pagination.test.tsx
npm test
git add -A && git commit -m "feat: add DataTable and Pagination common components"
```

---

## Task 6: 공통 컴포넌트 (StatusBadge, SearchInput)

**Files:**
- Test: `sentic-admin/src/components/common/StatusBadge.test.tsx`
- Create: `sentic-admin/src/components/common/StatusBadge.tsx`
- Test: `sentic-admin/src/components/common/SearchInput.test.tsx`
- Create: `sentic-admin/src/components/common/SearchInput.tsx`

**Interfaces:**
- Consumes: `Input` (Task 3)
- Produces: `StatusBadge({ status, kind: "member" | "payment" })`, `SearchInput({ value, onChange, placeholder?, debounceMs? })` — Task 9/10이 사용.

- [ ] **Step 1: StatusBadge 실패하는 테스트 작성**

Create `sentic-admin/src/components/common/StatusBadge.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the Korean label for a member status", () => {
    render(<StatusBadge status="ACTIVE" kind="member" />);
    expect(screen.getByText("활성")).toBeInTheDocument();
  });

  it("renders the Korean label for a payment status", () => {
    render(<StatusBadge status="FAILED" kind="payment" />);
    expect(screen.getByText("실패")).toBeInTheDocument();
  });

  it("falls back to the raw status for unknown values", () => {
    render(<StatusBadge status="UNKNOWN" kind="member" />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- StatusBadge.test.tsx
```

Expected: FAIL — `Cannot find module './StatusBadge'`.

- [ ] **Step 3: StatusBadge 구현**

Create `sentic-admin/src/components/common/StatusBadge.tsx`:

```tsx
type BadgeTone = "green" | "gray" | "yellow" | "red";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-green-100 text-green-700",
  gray: "bg-slate-100 text-slate-600",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

const MEMBER_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "활성", tone: "green" },
  INACTIVE: { label: "비활성", tone: "gray" },
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "대기", tone: "yellow" },
  SUCCESS: { label: "성공", tone: "green" },
  FAILED: { label: "실패", tone: "red" },
  CANCELLED: { label: "취소", tone: "gray" },
};

interface StatusBadgeProps {
  status: string;
  kind: "member" | "payment";
}

export function StatusBadge({ status, kind }: StatusBadgeProps) {
  const map = kind === "member" ? MEMBER_STATUS_LABEL : PAYMENT_STATUS_LABEL;
  const entry = map[status] ?? { label: status, tone: "gray" as BadgeTone };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[entry.tone]}`}
    >
      {entry.label}
    </span>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- StatusBadge.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: SearchInput 실패하는 테스트 작성**

Create `sentic-admin/src/components/common/SearchInput.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onChange after the debounce delay", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchInput value="" onChange={onChange} debounceMs={300} />);

    await user.type(screen.getByRole("textbox"), "alice");
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith("alice");
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- SearchInput.test.tsx
```

Expected: FAIL — `Cannot find module './SearchInput'`.

- [ ] **Step 7: SearchInput 구현**

Create `sentic-admin/src/components/common/SearchInput.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Input } from "../ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) {
        onChange(draft);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, debounceMs]);

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
    />
  );
}
```

- [ ] **Step 8: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- SearchInput.test.tsx
npm test
git add -A && git commit -m "feat: add StatusBadge and SearchInput common components"
```

---

## Task 7: 회원(Members) 데이터 레이어

**Files:**
- Create: `sentic-admin/src/features/members/types.ts`
- Test: `sentic-admin/src/features/members/api.test.ts`
- Create: `sentic-admin/src/features/members/api.ts`
- Test: `sentic-admin/src/features/members/hooks.test.tsx`
- Create: `sentic-admin/src/features/members/hooks.ts`

**Interfaces:**
- Consumes: `apiClient` (Task 2)
- Produces: `Member`, `MemberStatus`, `MemberListResponse` 타입; `fetchMembers`, `fetchMember`, `updateMemberStatus` 함수; `useMembers(keyword, page)`, `useMember(id)`, `useUpdateMemberStatus()` 훅 — Task 9/10 페이지가 사용.

- [ ] **Step 1: 타입 정의**

Create `sentic-admin/src/features/members/types.ts`:

```ts
export type MemberStatus = "ACTIVE" | "INACTIVE";

export interface Member {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
  status: MemberStatus;
}

export interface MemberListResponse {
  content: Member[];
  totalElements: number;
  totalPages: number;
}

export interface FetchMembersParams {
  keyword: string;
  page: number;
}
```

- [ ] **Step 2: api.ts 실패하는 테스트 작성**

Create `sentic-admin/src/features/members/api.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMembers, fetchMember, updateMemberStatus } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

describe("members api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.patch).mockReset();
  });

  it("fetchMembers requests the members list with keyword and page", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });
    const result = await fetchMembers({ keyword: "alice", page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members", {
      params: { keyword: "alice", page: 1 },
    });
    expect(result.totalPages).toBe(0);
  });

  it("fetchMember requests a single member by id", async () => {
    const member = {
      id: "1",
      email: "a@b.com",
      nickname: "a",
      createdAt: "2026-01-01",
      status: "ACTIVE",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: member });
    const result = await fetchMember("1");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members/1");
    expect(result).toEqual(member);
  });

  it("updateMemberStatus patches the member status", async () => {
    const member = {
      id: "1",
      email: "a@b.com",
      nickname: "a",
      createdAt: "2026-01-01",
      status: "INACTIVE",
    };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: member });
    const result = await updateMemberStatus("1", "INACTIVE");
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/members/1/status", {
      status: "INACTIVE",
    });
    expect(result.status).toBe("INACTIVE");
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/members/api.test.ts
```

Expected: FAIL — `Cannot find module './api'`.

- [ ] **Step 4: api.ts 구현**

Create `sentic-admin/src/features/members/api.ts`:

```ts
import { apiClient } from "../../lib/apiClient";
import type {
  FetchMembersParams,
  Member,
  MemberListResponse,
  MemberStatus,
} from "./types";

export async function fetchMembers(
  params: FetchMembersParams
): Promise<MemberListResponse> {
  const { data } = await apiClient.get<MemberListResponse>("/admin/members", {
    params: { keyword: params.keyword, page: params.page },
  });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  const { data } = await apiClient.get<Member>(`/admin/members/${id}`);
  return data;
}

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  const { data } = await apiClient.patch<Member>(
    `/admin/members/${id}/status`,
    { status }
  );
  return data;
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/members/api.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 6: hooks.ts 실패하는 테스트 작성 (낙관적 업데이트 핵심 로직)**

Create `sentic-admin/src/features/members/hooks.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMembers, useUpdateMemberStatus } from "./hooks";
import * as api from "./api";
import type { Member, MemberListResponse } from "./types";

vi.mock("./api");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const member: Member = {
  id: "1",
  email: "a@b.com",
  nickname: "a",
  createdAt: "2026-01-01",
  status: "ACTIVE",
};

describe("useUpdateMemberStatus", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockReset();
    vi.mocked(api.updateMemberStatus).mockReset();
  });

  it("optimistically updates the cached member list before the request resolves", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue({
      content: [member],
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(api.updateMemberStatus).mockReturnValue(new Promise(() => {}));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers("", 0), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MemberListResponse>([
        "members",
        "",
        0,
      ]);
      expect(cached?.content[0].status).toBe("INACTIVE");
    });
  });

  it("rolls back the optimistic update when the request fails", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue({
      content: [member],
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(api.updateMemberStatus).mockRejectedValue(
      new Error("network error")
    );

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers("", 0), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));

    const cached = queryClient.getQueryData<MemberListResponse>([
      "members",
      "",
      0,
    ]);
    expect(cached?.content[0].status).toBe("ACTIVE");
  });
});
```

- [ ] **Step 7: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/members/hooks.test.tsx
```

Expected: FAIL — `Cannot find module './hooks'`.

- [ ] **Step 8: hooks.ts 구현**

Create `sentic-admin/src/features/members/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMember, fetchMembers, updateMemberStatus } from "./api";
import type { Member, MemberListResponse, MemberStatus } from "./types";

export function membersQueryKey(keyword: string, page: number) {
  return ["members", keyword, page] as const;
}

export function memberQueryKey(id: string) {
  return ["member", id] as const;
}

export function useMembers(keyword: string, page: number) {
  return useQuery({
    queryKey: membersQueryKey(keyword, page),
    queryFn: () => fetchMembers({ keyword, page }),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberQueryKey(id),
    queryFn: () => fetchMember(id),
    enabled: Boolean(id),
  });
}

interface UpdateStatusVariables {
  id: string;
  status: MemberStatus;
}

interface MutationContext {
  previousMemberLists: [readonly unknown[], MemberListResponse | undefined][];
  previousMember: Member | undefined;
  id: string;
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateStatusVariables) =>
      updateMemberStatus(id, status),
    onMutate: async ({ id, status }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["members"] });
      await queryClient.cancelQueries({ queryKey: memberQueryKey(id) });

      const previousMemberLists =
        queryClient.getQueriesData<MemberListResponse>({
          queryKey: ["members"],
        });
      const previousMember = queryClient.getQueryData<Member>(
        memberQueryKey(id)
      );

      queryClient.setQueriesData<MemberListResponse>(
        { queryKey: ["members"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((member) =>
              member.id === id ? { ...member, status } : member
            ),
          };
        }
      );

      if (previousMember) {
        queryClient.setQueryData<Member>(memberQueryKey(id), {
          ...previousMember,
          status,
        });
      }

      return { previousMemberLists, previousMember, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      context.previousMemberLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context.previousMember) {
        queryClient.setQueryData(
          memberQueryKey(context.id),
          context.previousMember
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: memberQueryKey(variables.id) });
    },
  });
}
```

- [ ] **Step 9: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/members/hooks.test.tsx
npm test
git add -A && git commit -m "feat: add members data layer with optimistic status update"
```

---

## Task 8: 결제(Payments) 데이터 레이어 (회원 상세용 최소 구현)

**Files:**
- Create: `sentic-admin/src/features/payments/types.ts`
- Test: `sentic-admin/src/features/payments/api.test.ts`
- Create: `sentic-admin/src/features/payments/api.ts`
- Test: `sentic-admin/src/features/payments/hooks.test.tsx`
- Create: `sentic-admin/src/features/payments/hooks.ts`

**Interfaces:**
- Consumes: `apiClient` (Task 2)
- Produces: `Payment`, `PaymentStatus` 타입; `fetchMemberPayments` 함수; `useMemberPayments(memberId)` 훅 — Task 10의 회원 상세 페이지가 사용.

- [ ] **Step 1: 타입 정의**

Create `sentic-admin/src/features/payments/types.ts`:

```ts
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: string;
  memberId: string;
  memberEmail: string;
  memberNickname: string;
  amount: number;
  planName: string;
  status: PaymentStatus;
  paidAt: string;
}
```

- [ ] **Step 2: api.ts 실패하는 테스트 작성**

Create `sentic-admin/src/features/payments/api.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMemberPayments } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("payments api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("fetches payments for a member", async () => {
    const payments = [
      {
        id: "p1",
        memberId: "1",
        memberEmail: "a@b.com",
        memberNickname: "a",
        amount: 9900,
        planName: "Premium",
        status: "SUCCESS",
        paidAt: "2026-01-01",
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: payments });
    const result = await fetchMemberPayments("1");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members/1/payments");
    expect(result).toEqual(payments);
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/payments/api.test.ts
```

Expected: FAIL — `Cannot find module './api'`.

- [ ] **Step 4: api.ts 구현**

Create `sentic-admin/src/features/payments/api.ts`:

```ts
import { apiClient } from "../../lib/apiClient";
import type { Payment } from "./types";

export async function fetchMemberPayments(memberId: string): Promise<Payment[]> {
  const { data } = await apiClient.get<Payment[]>(
    `/admin/members/${memberId}/payments`
  );
  return data;
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/payments/api.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 6: hooks.ts 실패하는 테스트 작성**

Create `sentic-admin/src/features/payments/hooks.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMemberPayments } from "./hooks";
import * as api from "./api";

vi.mock("./api");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMemberPayments", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMemberPayments).mockReset();
  });

  it("does not fetch when memberId is empty", () => {
    renderHook(() => useMemberPayments(""), { wrapper });
    expect(api.fetchMemberPayments).not.toHaveBeenCalled();
  });

  it("fetches payments when memberId is provided", async () => {
    vi.mocked(api.fetchMemberPayments).mockResolvedValue([]);
    const { result } = renderHook(() => useMemberPayments("1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchMemberPayments).toHaveBeenCalledWith("1");
  });
});
```

- [ ] **Step 7: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/payments/hooks.test.tsx
```

Expected: FAIL — `Cannot find module './hooks'`.

- [ ] **Step 8: hooks.ts 구현**

Create `sentic-admin/src/features/payments/hooks.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchMemberPayments } from "./api";

export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => fetchMemberPayments(memberId),
    enabled: Boolean(memberId),
  });
}
```

- [ ] **Step 9: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- features/payments/hooks.test.tsx
npm test
git add -A && git commit -m "feat: add payments data layer for member payment history"
```

---

## Task 9: MembersListPage

**Files:**
- Test: `sentic-admin/src/pages/members/MembersListPage.test.tsx`
- Create: `sentic-admin/src/pages/members/MembersListPage.tsx`

**Interfaces:**
- Consumes: `useMembers`, `useUpdateMemberStatus` (Task 7), `DataTable`, `Pagination`, `SearchInput`, `StatusBadge` (Task 5/6)
- Produces: `MembersListPage` — Task 10 라우터가 `/members`에 매핑.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `sentic-admin/src/pages/members/MembersListPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MembersListPage } from "./MembersListPage";
import * as hooks from "../../features/members/hooks";

vi.mock("../../features/members/hooks");

const member = {
  id: "1",
  email: "a@b.com",
  nickname: "Alice",
  createdAt: "2026-01-01T00:00:00Z",
  status: "ACTIVE" as const,
};

describe("MembersListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useMembers).mockReturnValue({
      data: { content: [member], totalElements: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof hooks.useMembers>);
    vi.mocked(hooks.useUpdateMemberStatus).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateMemberStatus>);
  });

  it("renders the member list", () => {
    render(
      <MemoryRouter>
        <MembersListPage />
      </MemoryRouter>
    );
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("triggers the status mutation when the toggle button is clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useUpdateMemberStatus).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateMemberStatus>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MembersListPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: "비활성으로 전환" }));
    expect(mutate).toHaveBeenCalledWith({ id: "1", status: "INACTIVE" });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- pages/members/MembersListPage.test.tsx
```

Expected: FAIL — `Cannot find module './MembersListPage'`.

- [ ] **Step 3: MembersListPage 구현**

Create `sentic-admin/src/pages/members/MembersListPage.tsx`:

```tsx
import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { Pagination } from "../../components/common/Pagination";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMembers, useUpdateMemberStatus } from "../../features/members/hooks";
import type { Member } from "../../features/members/types";

export function MembersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const page = Number(searchParams.get("page") ?? "0");

  const { data, isLoading, isError } = useMembers(keyword, page);
  const updateStatus = useUpdateMemberStatus();

  function handleKeywordChange(nextKeyword: string) {
    setSearchParams({ keyword: nextKeyword, page: "0" });
  }

  function handlePageChange(nextPage: number) {
    setSearchParams({ keyword, page: String(nextPage) });
  }

  function handleToggleStatus(member: Member) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({ id: member.id, status: nextStatus });
  }

  const columns: DataTableColumn<Member>[] = [
    {
      key: "email",
      header: "이메일",
      render: (member) => (
        <Link
          to={`/members/${member.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {member.email}
        </Link>
      ),
    },
    { key: "nickname", header: "닉네임", render: (member) => member.nickname },
    {
      key: "createdAt",
      header: "가입일",
      render: (member) => new Date(member.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "status",
      header: "상태",
      render: (member) => <StatusBadge status={member.status} kind="member" />,
    },
    {
      key: "actions",
      header: "관리",
      render: (member) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => handleToggleStatus(member)}
          disabled={updateStatus.isPending}
        >
          {member.status === "ACTIVE" ? "비활성으로 전환" : "활성으로 전환"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">회원관리</h1>
      <SearchInput
        value={keyword}
        onChange={handleKeywordChange}
        placeholder="이메일 또는 닉네임 검색"
      />
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">회원 목록을 불러오지 못했습니다.</p>
      )}
      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.content}
            rowKey={(member) => member.id}
          />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인 후 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- pages/members/MembersListPage.test.tsx
npm test
git add -A && git commit -m "feat: add members list page with search, pagination, and status toggle"
```

---

## Task 10: MemberDetailPage + 라우터 최종 연결

**Files:**
- Test: `sentic-admin/src/pages/members/MemberDetailPage.test.tsx`
- Create: `sentic-admin/src/pages/members/MemberDetailPage.tsx`
- Create: `sentic-admin/src/routes/router.tsx`
- Modify: `sentic-admin/src/App.tsx`
- Modify: `sentic-admin/src/main.tsx`

**Interfaces:**
- Consumes: `useMember`, `useUpdateMemberStatus` (Task 7), `useMemberPayments` (Task 8), `DataTable`, `StatusBadge` (Task 5/6), `AuthProvider`, `ProtectedRoute`, `LoginPage` (Task 3), `AdminLayout` (Task 4), `queryClient` (Task 2), `MembersListPage` (Task 9)
- Produces: `MemberDetailPage`, 최종 `router`, `App`

- [ ] **Step 1: MemberDetailPage 실패하는 테스트 작성**

Create `sentic-admin/src/pages/members/MemberDetailPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MemberDetailPage } from "./MemberDetailPage";
import * as memberHooks from "../../features/members/hooks";
import * as paymentHooks from "../../features/payments/hooks";

vi.mock("../../features/members/hooks");
vi.mock("../../features/payments/hooks");

const member = {
  id: "1",
  email: "a@b.com",
  nickname: "Alice",
  createdAt: "2026-01-01T00:00:00Z",
  status: "ACTIVE" as const,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/members/1"]}>
      <Routes>
        <Route path="/members/:memberId" element={<MemberDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MemberDetailPage", () => {
  beforeEach(() => {
    vi.mocked(memberHooks.useMember).mockReturnValue({
      data: member,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof memberHooks.useMember>);
    vi.mocked(memberHooks.useUpdateMemberStatus).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof memberHooks.useUpdateMemberStatus>);
    vi.mocked(paymentHooks.useMemberPayments).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof paymentHooks.useMemberPayments>);
  });

  it("renders member details", () => {
    renderPage();
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows the empty payments message when there is no payment history", () => {
    renderPage();
    expect(screen.getByText("결제 내역이 없습니다.")).toBeInTheDocument();
  });

  it("triggers the status mutation when the toggle button is clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(memberHooks.useUpdateMemberStatus).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof memberHooks.useUpdateMemberStatus>);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "비활성으로 전환" }));
    expect(mutate).toHaveBeenCalledWith({ id: "1", status: "INACTIVE" });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- pages/members/MemberDetailPage.test.tsx
```

Expected: FAIL — `Cannot find module './MemberDetailPage'`.

- [ ] **Step 3: MemberDetailPage 구현**

Create `sentic-admin/src/pages/members/MemberDetailPage.tsx`:

```tsx
import { Link, useParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMember, useUpdateMemberStatus } from "../../features/members/hooks";
import { useMemberPayments } from "../../features/payments/hooks";
import type { Payment } from "../../features/payments/types";

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const id = memberId ?? "";

  const { data: member, isLoading, isError } = useMember(id);
  const { data: payments } = useMemberPayments(id);
  const updateStatus = useUpdateMemberStatus();

  function handleToggleStatus() {
    if (!member) return;
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({ id: member.id, status: nextStatus });
  }

  const paymentColumns: DataTableColumn<Payment>[] = [
    { key: "planName", header: "플랜", render: (payment) => payment.planName },
    {
      key: "amount",
      header: "금액",
      render: (payment) => `${payment.amount.toLocaleString("ko-KR")}원`,
    },
    {
      key: "status",
      header: "상태",
      render: (payment) => <StatusBadge status={payment.status} kind="payment" />,
    },
    {
      key: "paidAt",
      header: "결제일",
      render: (payment) => new Date(payment.paidAt).toLocaleDateString("ko-KR"),
    },
  ];

  if (isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  if (isError || !member) {
    return <p className="text-sm text-red-600">회원 정보를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/members" className="text-sm text-slate-500 hover:underline">
        ← 회원 목록으로
      </Link>
      <h1 className="text-lg font-semibold">회원 상세</h1>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">이메일</dt>
        <dd>{member.email}</dd>
        <dt className="text-slate-500">닉네임</dt>
        <dd>{member.nickname}</dd>
        <dt className="text-slate-500">가입일</dt>
        <dd>{new Date(member.createdAt).toLocaleDateString("ko-KR")}</dd>
        <dt className="text-slate-500">상태</dt>
        <dd>
          <StatusBadge status={member.status} kind="member" />
        </dd>
      </dl>
      <button
        type="button"
        className="rounded border px-3 py-1.5 text-sm hover:bg-slate-100"
        onClick={handleToggleStatus}
        disabled={updateStatus.isPending}
      >
        {member.status === "ACTIVE" ? "비활성으로 전환" : "활성으로 전환"}
      </button>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">결제 내역</h2>
        <DataTable
          columns={paymentColumns}
          data={payments ?? []}
          rowKey={(payment) => payment.id}
          emptyMessage="결제 내역이 없습니다."
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test -- pages/members/MemberDetailPage.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: 라우터 최종 구성**

Create `sentic-admin/src/routes/router.tsx`:

```tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { MembersListPage } from "../pages/members/MembersListPage";
import { MemberDetailPage } from "../pages/members/MemberDetailPage";

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="/members" replace /> },
          { path: "members", Component: MembersListPage },
          { path: "members/:memberId", Component: MemberDetailPage },
        ],
      },
    ],
  },
]);
```

Replace `sentic-admin/src/App.tsx` with:

```tsx
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./features/auth/AuthContext";
import { router } from "./routes/router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

Replace `sentic-admin/src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: 전체 테스트 통과 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && npm test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 7: 개발 서버로 수동 확인**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local
npm run dev -- --port 5183 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5183/login
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5183/members
kill %1
```

Expected: 둘 다 `200` (SPA이므로 라우팅은 클라이언트에서 처리되고 서버는 `index.html`을 반환). 브라우저로 직접 열어서 `/members` 접근 시 `/login`으로 리다이렉트되는지, 로그인 폼에 잘못된 값을 넣었을 때 백엔드가 없어 네트워크 에러가 나며 에러 메시지가 뜨는지 확인한다.

- [ ] **Step 8: 커밋**

```bash
cd "C:/Users/yume1/Documents/GitHub/sentic-admin" && git add -A && git commit -m "feat: add member detail page and wire full router"
```

---

## 향후 작업 (이 계획의 범위 밖)

- 공지사항 목록/작성/수정/삭제 페이지 (`ConfirmDialog` 공통 컴포넌트 필요)
- FAQ 목록/작성/수정/삭제 + 순서 변경 페이지
- 결제 내역 전체 목록 페이지 (상태 필터 + `?memberId=` 딥링크)
- 실제 백엔드 API 확정 후 `features/*/api.ts` 업데이트
