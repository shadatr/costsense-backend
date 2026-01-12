import { Router } from "express";
import axios from "axios";

const router = Router();

// GET /api/v1/forecast/food?months=3
router.get("/food", async (req, res) => {
  try {
    const months = req.query.months ?? 3;

    const response = await axios.get(
      "http://127.0.0.1:8001/forecast/food",
      { params: { months } }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("ML service error:", error);
    return res.status(502).json({
      error: "Forecast service unavailable"
    });
  }
});

export default router;
