/* Teaching guide: This file contains customer history page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Provides the Customer History UI for the customers feature.
import { useEffect, useState } from "react";
import { Box, Button, Chip, TextField } from "@mui/material";
import toast from "react-hot-toast";
import type { Customer } from "../../api/customerApi";
import { date, money, SegmentBadge, title } from "./customerShared";
function Profile({
  customer,
  full = false,
}: {
  customer: Customer;
  full?: boolean;
}) {
  const s = customer.summary;
  return (
    <Box
      className={
        full ? "customer-profile customer-profile--full" : "customer-profile"
      }
    >
      <Box className="customer-profile-head">
        <span className="customer-avatar">
          {customer.fullName
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)
            .join("")}
        </span>
        <Box>
          <h3>{customer.fullName}</h3>
          <small>{customer.customerId}</small>
          <div>
            <Chip
              size="small"
              color={customer.status === "ACTIVE" ? "success" : "default"}
              label={title(customer.status)}
            />
            <SegmentBadge segment={customer.segment} />
          </div>
        </Box>
      </Box>
      <section>
        <h4>Personal & Contact Information</h4>
        <p>âœ‰ {customer.email}</p>
        <p>â˜Ž {customer.phone}</p>
        <p>
          âŒ–{" "}
          {[customer.address, customer.city, customer.state, customer.country]
            .filter(Boolean)
            .join(", ") || "No address added"}
        </p>
        {full && (
          <>
            <p>
              Date of birth <b>{date(customer.dateOfBirth)}</b>
            </p>
            <p>
              Gender <b>{customer.gender || "â€”"}</b>
            </p>
            <p>
              Customer type <b>{title(customer.customerType)}</b>
            </p>
          </>
        )}
      </section>
      <section>
        <h4>Business Information</h4>
        <dl>
          <div>
            <dt>Lifetime Revenue</dt>
            <dd>{money(s.totalRevenue)}</dd>
          </div>
          <div>
            <dt>Total Orders</dt>
            <dd>{s.totalOrders}</dd>
          </div>
          <div>
            <dt>Average Order Value</dt>
            <dd>{money(s.averageOrderValue)}</dd>
          </div>
          <div>
            <dt>Purchase Frequency</dt>
            <dd>{Number(s.purchaseFrequency).toFixed(1)} / month</dd>
          </div>
          <div>
            <dt>Last Purchase</dt>
            <dd>{date(s.lastPurchaseDate)}</dd>
          </div>
          {full && (
            <>
              <div>
                <dt>Favorite Category</dt>
                <dd>{s.favoriteCategory || "â€”"}</dd>
              </div>
              <div>
                <dt>Favorite Product</dt>
                <dd>{s.favoriteProduct || "â€”"}</dd>
              </div>
            </>
          )}
        </dl>
      </section>
    </Box>
  );
}
// The declarations below define the public data used by this module.
export type HistoryView =
  | "profile"
  | "purchase-history"
  | "recent-activity"
  | "purchase-summary"
  | "recent-transactions"
  | "most-purchased-products"
  | "timeline"
  | "notes";
function PurchaseSummaryView({ customer }: { customer: Customer }) {
  const s = customer.summary;
  return (
    <Box className="purchase-summary history-card">
      <h2>Purchase Summary</h2>
      <Box>
        {[
          ["Total Orders", s.totalOrders],
          ["Total Revenue", money(s.totalRevenue)],
          ["Total Quantity", s.totalProductsPurchased],
          ["Average Order Value", money(s.averageOrderValue)],
          ["First Purchase", date(s.firstPurchaseDate)],
          ["Last Purchase", date(s.lastPurchaseDate)],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </Box>
    </Box>
  );
}
function TransactionsView({ customer }: { customer: Customer }) {
  const transactions = customer.recentTransactions ?? [];
  return (
    <Box className="history-card transaction-view">
      <h2>Recent Transactions</h2>
      {transactions.length ? (
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Channel</th>
              <th>Payment</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id}>
                <td>{item.invoiceNumber}</td>
                <td>{date(item.saleDate)}</td>
                <td>{title(item.salesChannel)}</td>
                <td>{title(item.paymentMethod)}</td>
                <td>
                  <b>{money(item.totalAmount)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Box className="customer-empty">
          No transactions recorded for this customer.
        </Box>
      )}
    </Box>
  );
}
function ProductsView({ customer }: { customer: Customer }) {
  const products = customer.mostPurchasedProducts ?? [];
  return (
    <Box className="history-card product-view">
      <h2>Most Purchased Products</h2>
      {products.length ? (
        products.map((item, index) => (
          <Box key={item.productName}>
            <span className="product-rank">{index + 1}</span>
            <strong>{item.productName}</strong>
            <span>{item.quantity} units</span>
            <b>{item.purchaseCount} orders</b>
          </Box>
        ))
      ) : (
        <Box className="customer-empty">No purchased products recorded.</Box>
      )}
    </Box>
  );
}
function TimelineView({ customer }: { customer: Customer }) {
  const timeline = customer.timeline ?? [];
  return (
    <Box className="timeline history-card">
      <h2>Customer Timeline</h2>
      {timeline.length ? (
        timeline.map((item) => (
          <article key={item.id}>
            <i />
            <time>{date(item.occurredAt)}</time>
            <div>
              <b>{item.event}</b>
              <p>{item.details}</p>
            </div>
          </article>
        ))
      ) : (
        <Box className="customer-empty">No timeline activity available.</Box>
      )}
    </Box>
  );
}
function NotesView({ customer }: { customer: Customer }) {
  const storageKey = `customer-notes-${customer.id}`;
  const [notes, setNotes] = useState(
    () => localStorage.getItem(storageKey) || "",
  );
  useEffect(
    () => setNotes(localStorage.getItem(storageKey) || ""),
    [storageKey],
  );
  return (
    <Box className="history-card notes-view">
      <h2>Customer Notes</h2>
      <TextField
        multiline
        minRows={8}
        fullWidth
        placeholder="Add notes about this customer..."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <Button
        variant="contained"
        onClick={() => {
          localStorage.setItem(storageKey, notes);
          toast.success("Customer notes saved");
        }}
      >
        Save Notes
      </Button>
    </Box>
  );
}
export default function HistoryViewContent({
  customer,
  view,
}: {
  customer: Customer;
  view: HistoryView;
}) {
  if (view === "profile") return <Profile customer={customer} full />;
  if (view === "purchase-summary")
    return <PurchaseSummaryView customer={customer} />;
  if (view === "recent-transactions")
    return <TransactionsView customer={customer} />;
  if (view === "most-purchased-products")
    return <ProductsView customer={customer} />;
  if (view === "timeline") return <TimelineView customer={customer} />;
  if (view === "notes") return <NotesView customer={customer} />;
  if (view === "recent-activity")
    return (
      <Box className="history-view-stack">
        <TransactionsView customer={customer} />
        <TimelineView customer={customer} />
      </Box>
    );
  return (
    <Box className="history-view-stack">
      <PurchaseSummaryView customer={customer} />
      <Box className="history-two-column">
        <ProductsView customer={customer} />
        <TransactionsView customer={customer} />
      </Box>
    </Box>
  );
}
