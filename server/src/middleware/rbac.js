/**
 * Role-Based Access Control (RBAC) guard.
 * Accepts one or more allowed roles.
 * Returns 403 if the user role is not in the list.
 */
const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have permission to access this resource.'
      });
    }
    next();
  };
};

module.exports = rbac;
