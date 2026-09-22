import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api",

  timeout: 20_000,

  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

// Auto-bypass ngrok interstitial ONLY for requests to ngrok or backend API
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let urlStr = "";
    if (typeof input === "string") {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input && typeof (input as Request).url === "string") {
      urlStr = (input as Request).url;
    }

    const isNgrokOrApi =
      urlStr.includes("ngrok") ||
      Boolean(
        process.env.NEXT_PUBLIC_API_URL &&
          urlStr.includes(process.env.NEXT_PUBLIC_API_URL)
      );

    if (isNgrokOrApi) {
      const reqHeaders = new Headers(init?.headers);
      if (!reqHeaders.has("ngrok-skip-browser-warning")) {
        reqHeaders.set("ngrok-skip-browser-warning", "69420");
      }
      return originalFetch(input, { ...init, headers: reqHeaders });
    }

    return originalFetch(input, init);
  };
}

/* ============================================================
   REQUEST INTERCEPTOR
============================================================ */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers["ngrok-skip-browser-warning"] = "69420";
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   RESPONSE INTERCEPTOR
============================================================ */

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const pathname = window.location.pathname;

      const publicPaths = ["/login", "/register"];

      if (!publicPaths.includes(pathname)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("memberTier");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
