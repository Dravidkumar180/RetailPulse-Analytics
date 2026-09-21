/* Lets the user choose whether the CSV contains products, customers, or sales. */
import { TYPES } from "./importConstants";
import type { DataImportsPageState } from "./useDataImportsPage";

type Props = Pick<
  DataImportsPageState,
  "selectRef" | "type" | "setType" | "clear"
>;

export default function ImportTypeSelector({
  selectRef,
  type,
  setType,
  clear,
}: Props) {
  return (
    <section ref={selectRef} className="imports-card import-types">
      <div className="imports-section-head">
        <div>
          <span>Step 1 · Select & Upload</span>
          <h2>Select import type</h2>
        </div>
        <p>Choose the data your CSV contains.</p>
      </div>
      <div className="type-grid">
        {TYPES.map((item) => (
          <button
            key={item.value}
            className={type === item.value ? "type-card selected" : "type-card"}
            onClick={() => {
              setType(item.value);
              clear();
            }}
          >
            <i>{item.icon}</i>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <em>{type === item.value ? "Selected" : "Select"}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
