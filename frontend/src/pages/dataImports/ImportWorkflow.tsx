/* Shows which import steps are available, active, or complete. */
import { WORKFLOW_STEPS } from "./importConstants";
import type { DataImportsPageState } from "./useDataImportsPage";

type Props = Pick<
  DataImportsPageState,
  "reachedStep" | "completedThrough" | "activeStep" | "goToStep"
>;

export default function ImportWorkflow({
  reachedStep,
  completedThrough,
  activeStep,
  goToStep,
}: Props) {
  return (
    <nav className="import-workflow" aria-label="Data import progress">
      {WORKFLOW_STEPS.map((label, index) => {
        const available = index <= reachedStep || index === 4;
        const complete = index <= completedThrough;
        return (
          <button
            key={label}
            type="button"
            className={`${index === activeStep ? "active " : ""}${complete ? "complete" : ""}`}
            disabled={!available}
            onClick={() => goToStep(index)}
            aria-current={index === activeStep ? "step" : undefined}
          >
            <span>{complete ? "✓" : index + 1}</span>
            <strong>{label}</strong>
          </button>
        );
      })}
    </nav>
  );
}
