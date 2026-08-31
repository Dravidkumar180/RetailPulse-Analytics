/* Teaching guide: This file contains customers page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import CustomersWorkspace from "./CustomersWorkspace";

/** Route entry point for the Customer Management feature. */
// This component receives prepared data and renders the feature-specific interface.
export default function CustomersPage() {
  return <CustomersWorkspace />;
}
