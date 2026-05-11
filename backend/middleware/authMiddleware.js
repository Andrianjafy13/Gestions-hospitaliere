import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {

  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json("Accès refusé");

  try {

    const decoded = jwt.verify(token, "SECRET_KEY");

    req.user = decoded;

    next();

  } catch (error) {

    res.status(403).json("Token invalide");

  }

};

export const authorizeRole = (roles) => {

    return (req, res, next) => {
  
      if (!roles.includes(req.user.role))
        return res.status(403).json("Accès interdit");
  
      next();
  
    };
  
  };