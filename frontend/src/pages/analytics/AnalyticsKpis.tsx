/* Teaching guide: This file contains analytics kpis page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the analytics kpis section for the analytics feature.
import { Box, Card, CardContent, Skeleton } from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory2";
import DiscountIcon from "@mui/icons-material/Discount";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import type { AnalyticsDashboard } from "../../api/analyticsApi";
import { finite, money } from "./analyticsUtils";

// This component receives prepared data and renders the feature-specific interface.
export default function AnalyticsKpis({
  data,
  loading,
  updating,
}: {
  data?: AnalyticsDashboard;
  loading: boolean;
  updating: boolean;
}) {
  const cards = [
    {
      name: "Total Revenue",
      value: data?.kpis.totalRevenue,
      isMoney: true,
      icon: <CurrencyRupeeIcon />,
      tone: "blue",
    },
    {
      name: "Total Orders",
      value: data?.kpis.totalOrders,
      isMoney: false,
      icon: <ReceiptLongIcon />,
      tone: "violet",
    },
    {
      name: "Average Order Value",
      value: data?.kpis.averageOrderValue,
      isMoney: true,
      icon: <TrendingUpIcon />,
      tone: "teal",
    },
    {
      name: "Total Items Sold",
      value: data?.kpis.totalItemsSold,
      isMoney: false,
      icon: <InventoryIcon />,
      tone: "orange",
    },
    {
      name: "Total Discount",
      value: data?.kpis.totalDiscount,
      isMoney: true,
      icon: <DiscountIcon />,
      tone: "rose",
    },
    {
      name: "Total Tax",
      value: data?.kpis.totalTax,
      isMoney: true,
      icon: <AccountBalanceIcon />,
      tone: "cyan",
    },
  ];
  return (
    <Box
      className={`analytics-kpis ${updating ? "analytics-kpis--updating" : ""}`}
      aria-live="polite"
    >
      {cards.map((card) => (
        <Card
          key={card.name}
          className={`analytics-kpi analytics-kpi--${card.tone}`}
        >
          <CardContent>
            <Box className="analytics-kpi__icon">{card.icon}</Box>
            <Box className="analytics-kpi__copy">
              <span>{card.name}</span>
              {loading ? (
                <Skeleton width={105} height={34} />
              ) : (
                <strong>
                  {card.isMoney
                    ? money(card.value)
                    : finite(card.value).toLocaleString("en-IN")}
                </strong>
              )}
              <small>{updating ? "Updating…" : "Selected period"}</small>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
