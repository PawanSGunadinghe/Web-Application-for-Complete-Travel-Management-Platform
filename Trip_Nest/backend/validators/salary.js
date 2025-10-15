// validators/salary.js (CommonJS)
const { body } = require("express-validator");

exports.createSalaryRules = [
  body("employeeId").isMongoId().withMessage("Valid employeeId required"),
  body("currency").optional().isString().isLength({ min: 3, max: 5 }),
  body("base").isFloat({ min: 0 }).withMessage("Base must be >= 0"),
  body("effectiveFrom").isISO8601().toDate(),
  body("effectiveTo").optional({ nullable: true }).isISO8601().toDate(),
  body("components").optional().isArray(),
  body("components.*.type").isIn(["earning", "deduction"]),
  body("components.*.name").isString().trim().notEmpty(),
  body("components.*.amount").optional().isFloat({ min: 0 }),
  body("components.*.percentageOfBase").optional().isFloat({ min: 0, max: 100 }),
];
