import jwt from "jsonwebtoken";

const JWT_SECRET = "myjwtsecret";

const authenticateUser = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "Access Denied" });
  token = token.replace("Bearer ", "");

  try {
    jwt.verify(token, JWT_SECRET);
    req.user = jwt.decode(token);
    req.appName = req.originalUrl.includes("/feature")
      ? req.originalUrl.replace("/feature", "").split("/")[1]
      : false;
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid Token" });
  }
  if (!req.user) return res.status(401).json({ message: "Invalid Token" });
  next();
};

const verifyFeatureAccess = (req, res, next) => {
  const { appName } = req;

  if (!appName)
    return res
      .status(400)
      .json({ message: "Bad Request: Invalid Feature Path" });
  const roles = req.user?.roles || [];

  if (!roles.includes(appName))
    return res.status(403).json({ message: "Forbidden: Insufficient Role" });
  next();
};

const testApp2Dev = (req, res, next) => {
  if (!req.headers["testheader"])
    return res.status(403).json({ message: "You can't access /app2/dev" });
  next();
};

const middleware = {
  authenticateUser,
  verifyFeatureAccess,
  testApp2Dev,
};

export default middleware;
