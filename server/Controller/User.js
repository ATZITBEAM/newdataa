import { user } from "../Model/User.js";

export const register = async (req, res) => {
  const data = req.body;
  try {
    const createus = await user.create(data);
    res.status(200).json({
      message: "use addd",
      createus,
    });
  } catch (error) {
    res.status(400).json({
      message: "error",
    });
  }
};
