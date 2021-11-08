import axios from 'axios';
import store2 from 'store2';

const instance = axios.create({
  baseURL: `/api/`,
  timeout: 0,
  withCredentials: true,
});

instance?.interceptors.request.use(
  async function (config) {
    const appToken = store2('app-token');
    return { ...config, headers: { ...config.headers, Authorization: `Bearer ${appToken}` } };
  },
  function (error) {
    return Promise.reject(error);
  },
);

instance?.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response.status === 401) {
      window.location.href = '/api/oidc/keycloak/login';
    }

    return Promise.reject(error);
  },
);

export { instance };
