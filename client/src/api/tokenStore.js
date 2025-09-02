let ACCESS_TOKEN = null;

export const getAccessToken = () => ACCESS_TOKEN;
export const setAccessToken = (t) => { ACCESS_TOKEN = t || null; };
export const clearAccessToken = () => { ACCESS_TOKEN = null; };
