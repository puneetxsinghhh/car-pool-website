export function validateCreateUser(req, res, next) {

    const { name, email, role } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Name is required"
        });
    }

    if (!email || email.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    if (!email.includes("@")) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    if (!role) {
        return res.status(400).json({
            success: false,
            message: "Role is required"
        });
    }

    if (!["DRIVER", "PASSENGER"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be DRIVER or PASSENGER"
        });
    }

    next();
}