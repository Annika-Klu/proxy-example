const setCustomHeader = (proxyReq, req, res) => {
  proxyReq.setHeader("X-Custom-Header", "testvalue");
};

const onProxyMethods = {
  setCustomHeader,
};

export default onProxyMethods;
