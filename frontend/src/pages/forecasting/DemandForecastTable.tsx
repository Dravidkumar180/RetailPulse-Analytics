// Renders the demand forecast table data and related row actions.
import { Box, Typography } from "@mui/material";
import type { ForecastProduct, Recommendation } from "../../api/forecastApi";
const labels: Record<Recommendation, string> = {
  IMMEDIATE_RESTOCK: "Immediate Restock",
  REORDER_SOON: "Reorder Soon",
  STOCK_HEALTHY: "Stock Level Healthy",
  OVERSTOCK_RISK: "Overstock Risk",
};
// This component receives prepared data and renders the feature-specific interface.
const fmt = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export default function DemandForecastTable({
  title,
  products,
}: {
  title: string;
  products: ForecastProduct[];
}) {
  return (
    <Box className="forecast-card forecast-card--wide">
      <Box className="forecast-card__title">
        <Typography component="h2">{title}</Typography>
        <span>{products.length} products</span>
      </Box>
      <div className="forecast-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Historical Sales</th>
              <th>Predicted Demand</th>
              <th>Forecast Period</th>
              <th>Confidence</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <small>
                    {product.sku} · {product.category}
                  </small>
                </td>
                <td>{product.currentStock}</td>
                <td>{fmt(product.historicalSales)}</td>
                <td>
                  <strong>{fmt(product.predictedDemand)}</strong>
                </td>
                <td>Next forecast period</td>
                <td>
                  <span className="confidence">
                    <i style={{ width: `${product.confidence}%` }} />
                    {product.confidence}%
                  </span>
                </td>
                <td>
                  <span
                    className={`recommendation ${product.recommendation.toLowerCase()}`}
                  >
                    {labels[product.recommendation]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
}
