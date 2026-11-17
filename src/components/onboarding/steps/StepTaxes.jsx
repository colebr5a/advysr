import { StepWrapper } from '../shared/StepWrapper.jsx';
import { TaxDetailsForm } from '../../plan/TaxDetailsForm.jsx';

export function StepTaxes({ value, onChange, onNext, onBack }) {
  return (
    <StepWrapper
      title="Taxes & retirement"
      subtitle="Optional, but it lets us size your 401(k) match and pick Roth vs traditional. You can skip it."
      onNext={onNext} onBack={onBack} canNext={true} step={3} total={11}
    >
      <TaxDetailsForm value={value} onChange={onChange} />
    </StepWrapper>
  );
}
