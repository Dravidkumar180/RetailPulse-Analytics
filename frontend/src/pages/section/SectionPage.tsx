import { Box, Card, CardContent, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import "./SectionPage.css";

const sections = {
  "/products": { title: "Products", text: "Manage products, inventory and pricing.", icon: <Inventory2OutlinedIcon />, cards: ["Product Catalogue", "Inventory Status", "Product Categories"] },
  "/sales": { title: "Sales", text: "Review orders, transactions and sales performance.", icon: <PointOfSaleOutlinedIcon />, cards: ["Recent Orders", "Sales Transactions", "Revenue Summary"] },
  "/analytics": { title: "Analytics", text: "Explore trends and company performance insights.", icon: <AnalyticsOutlinedIcon />, cards: ["Sales Trends", "Customer Insights", "Channel Performance"] },
  "/reports": { title: "Reports", text: "Create, review and export company reports.", icon: <AssessmentOutlinedIcon />, cards: ["Available Reports", "Scheduled Reports", "Report History"] },
  "/companies": { title: "Companies", text: "Manage registered companies and their accounts.", icon: <BusinessOutlinedIcon />, cards: ["Company Directory", "Active Companies", "Company Activity"] },
  "/settings": { title: "Settings", text: "Configure your company and application preferences.", icon: <SettingsOutlinedIcon />, cards: ["Company Settings", "Security Settings", "Notification Preferences"] },
} as const;

const SectionPage = () => {
  const { pathname } = useLocation();
  const section = sections[pathname as keyof typeof sections] ?? sections["/products"];
  return <Box className="section-page"><Box className="section-page__heading"><i>{section.icon}</i><Box><Typography component="h1">{section.title}</Typography><Typography component="p">{section.text}</Typography></Box></Box><Box className="section-page__grid">{section.cards.map((card) => <Card key={card}><CardContent><Typography component="h2">{card}</Typography><Typography component="p">This {section.title.toLowerCase()} area is ready for your company data.</Typography></CardContent></Card>)}</Box></Box>;
};
export default SectionPage;
