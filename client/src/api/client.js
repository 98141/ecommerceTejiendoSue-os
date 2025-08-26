const useApi = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${baseUrl}/api/${endpoint}`;
};

export default useApi;

