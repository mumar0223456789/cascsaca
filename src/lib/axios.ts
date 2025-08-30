import Axios, { AxiosError } from "axios";
import { createClient } from "@/lib/supabase/client";

const axios = Axios.create({
  baseURL: "/", // Your API base URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minute timeout for AI responses
});

axios.interceptors.request.use(
  async (config) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      if (error.response.status === 401) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
