/* Teaching guide: This file contains movement table page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the movement table data and related row actions.
import { Box } from "@mui/material";
import type { InventoryMovement } from "../../api/inventoryApi";
import { MOVEMENT_LABEL } from "./inventoryConstants";
// This component receives prepared data and renders the feature-specific interface.
export default function MovementTable({ rows }: { rows: InventoryMovement[] }) {
  return (
    <Box className="inventory-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Movement Type</th>
            <th>Previous Qty</th>
            <th>Quantity Changed</th>
            <th>Updated Qty</th>
            <th>Reason</th>
            <th>Performed By</th>
            <th>Remarks</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.productName}</strong>
              </td>
              <td>{MOVEMENT_LABEL[row.movementType] || row.movementType}</td>
              <td>{row.previousQuantity}</td>
              <td
                className={
                  row.quantityChanged >= 0 ? "qty-positive" : "qty-negative"
                }
              >
                {row.quantityChanged > 0 ? "+" : ""}
                {row.quantityChanged}
              </td>
              <td>{row.updatedQuantity}</td>
              <td>{row.reason}</td>
              <td>{row.performedBy}</td>
              <td>{row.remarks || "—"}</td>
              <td>{new Date(row.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <Box className="inventory-empty">No stock movements recorded yet.</Box>
      )}
    </Box>
  );
}
