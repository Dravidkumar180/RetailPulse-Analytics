/* Teaching guide: This file contains replenishment details page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Provides the Replenishment Details UI for the forecasting feature.
import { Alert, Box } from "@mui/material";
import type {
  InventoryForecastItem,
  InventoryForecastResponse,
} from "../../api/inventoryForecastApi";

export function RecommendationComparison({
  item,
}: {
  item: InventoryForecastItem | null;
}) {
  if (!item) return <Box className="sr-card sr-empty">Select a product.</Box>;
  return (
    <Box id="recommendation-comparison" className="sr-card sr-compare">
      <div className="sr-title">
        <div>
          <h3>Recommendation Comparison</h3>
          <span>
            {item.product} · {item.sku}
          </span>
        </div>
        <em className={`quality ${item.dataQuality.toLowerCase()}`}>
          {item.dataQuality.replace("_", " ")}
        </em>
      </div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Current</th>
            <th>Recommended</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className={item.reorderRequired ? "action" : ""}>
            <td>Stock</td>
            <td>{item.currentStock}</td>
            <td>{item.recommendedStock}</td>
            <td>{item.reorderRequired ? "Action required" : "OK"}</td>
          </tr>
          <tr>
            <td>Daily Demand</td>
            <td>{item.averageDailySales}</td>
            <td>{item.averageDailySales}</td>
            <td>API calculated</td>
          </tr>
          <tr>
            <td>Reorder Point</td>
            <td>{item.reorderPoint}</td>
            <td>{item.reorderPoint}</td>
            <td>Threshold</td>
          </tr>
          <tr>
            <td>Safety Stock</td>
            <td>{item.safetyStock}</td>
            <td>{item.safetyStock}</td>
            <td>Buffer</td>
          </tr>
          <tr>
            <td>Recommended Qty.</td>
            <td>—</td>
            <td>{item.recommendedQuantity}</td>
            <td>{item.reorderRequired ? "Reorder required" : "No reorder"}</td>
          </tr>
        </tbody>
      </table>
      <Alert
        severity={
          item.reorderRequired
            ? "warning"
            : item.risk === "OVERSTOCK"
              ? "info"
              : "success"
        }
      >
        {item.reorderRequired
          ? `Current stock is below the required level. Reorder ${item.recommendedQuantity} units.`
          : item.risk === "OVERSTOCK"
            ? "Overstock detected. Pause purchasing and review demand."
            : "Current inventory is healthy; no reorder is required."}
      </Alert>
      {!item.hasSalesHistory && (
        <Alert severity="info">
          No sales history exists. Demand is treated as zero until sales are
          recorded.
        </Alert>
      )}
    </Box>
  );
}

// Explain the backend formulas and configuration used for recommendations.
export function ReplenishmentMethod({
  data,
}: {
  data: InventoryForecastResponse["method"];
}) {
  return (
    <Box className="sr-card sr-method">
      <div className="sr-title">
        <h3>How recommendations are calculated</h3>
      </div>
      <dl>
        <div>
          <dt>Forecasting method</dt>
          <dd>{data.name}</dd>
        </div>
        <div>
          <dt>Sales history</dt>
          <dd>Last {data.lookbackDays} days</dd>
        </div>
        <div>
          <dt>Weights</dt>
          <dd>{data.weights.join("% / ")}%</dd>
        </div>
        <div>
          <dt>Lead time</dt>
          <dd>{data.leadTimeDays} days</dd>
        </div>
        <div>
          <dt>Safety stock</dt>
          <dd>{data.safetyStockFormula}</dd>
        </div>
        <div>
          <dt>Reorder point</dt>
          <dd>{data.reorderPointFormula}</dd>
        </div>
        <div>
          <dt>Recommended quantity</dt>
          <dd>{data.recommendedQuantityFormula}</dd>
        </div>
      </dl>
      <small>
        Calculations use paid and pending sales, run on the backend, and are
        cached for five minutes.
      </small>
    </Box>
  );
}
