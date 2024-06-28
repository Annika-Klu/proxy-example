import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import middleware from "./middleware.js";
import onProxyMethods from "./onProxyMethods.js";
import config from "./config.json" assert { type: "json" };

const app = express();
app.use(express.json());
app.use("/feature/*", middleware.authenticateUser);

const createAppProxy = (target, useOnProxyMethods) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.method !== "GET" && req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
        if (!useOnProxyMethods) return;
        useOnProxyMethods.forEach((methodName) => {
          const method = onProxyMethods[methodName];
          method(proxyReq, req, res);
        });
      },
      error: (err, req, res) => {
        console.log(err);
      },
    },
  });
};

config.forEach((appConfig) => {
  const {
    proxyPath,
    basePort,
    proxyTargets,
    useMiddlewares,
    useOnProxyMethods,
  } = appConfig;

  for (const env of ["dev", "staging", "prod"]) {
    const routePath = `${proxyPath}/${env}`;
    let middlewareNames = [];
    if (useMiddlewares) middlewareNames = useMiddlewares[env];
    let target;
    if (proxyTargets) target = proxyTargets[env];
    else if (basePort) {
      let port = basePort;
      if (env == "dev") port += 1;
      if (env == "staging") port += 9;
      target = `http://localhost:${port}`;
    }
    let onProxyMethods = [];
    if (useOnProxyMethods) onProxyMethods = useOnProxyMethods[env];
    app.use(
      routePath,
      middlewareNames.map((middlewareName) => middleware[middlewareName]),
      createAppProxy(target, onProxyMethods)
    );
  }
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Auth and proxy server running on port ${PORT}`);
});
