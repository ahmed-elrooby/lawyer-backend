import AppError from "./../utils/AppError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new AppError(error.details.map((item) => item.message).join(", "), 400),
      );
    }

    next();
  };
};

export default validate;
