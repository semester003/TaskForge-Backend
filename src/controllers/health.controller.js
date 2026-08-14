const healthCheck = (req, res) => {

    res.status(200).json({

        success: true,

        message: "TaskForge API is running"

    });

};

module.exports = {

    healthCheck

};
