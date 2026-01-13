import { Router } from "express";
import axios from "axios";

const router = Router();

const ML_SERVICE_URL = "http://127.0.0.1:8001";

// GET /api/v1/forecast/:category?months=3
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const months = req.query.months ?? 3;

    const response = await axios.get(
      `${ML_SERVICE_URL}/forecast/${category}`,
      { params: { months } }
    );

    return res.json(response.data);
  } catch (error: any) {
    console.error("ML service error:", error?.message);

    return res.status(502).json({
      error: "Forecast service unavailable",
      category: req.params.category,
    });
  }
});

export default router;
