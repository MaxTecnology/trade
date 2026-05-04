import axios from "axios";
import state from "../store";

const api = axios.create({
  baseURL: "/api/v1/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tokenRedeTrade");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthEndpoint = url.includes('auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expirado fora do fluxo de login — limpa e redireciona
      localStorage.removeItem("tokenRedeTrade");
      state.logged = false;
      state.user = null;
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
