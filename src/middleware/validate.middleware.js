const validate = (schema) => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body); //  check if the request body matches the schema

        if (!result.success) {

            return res.status(400).json({

                success: false,

                errors: result.error.issues

            });

        }

        next();

    };

};

module.exports = validate;