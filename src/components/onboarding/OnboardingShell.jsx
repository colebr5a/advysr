import { useState } from 'react';
import { StepAge } from './steps/StepAge.jsx';
import { StepIncome } from './steps/StepIncome.jsx';
import { StepFixedExpenses } from './steps/StepFixedExpenses.jsx';
import { StepVariableExpenses } from './steps/StepVariableExpenses.jsx';
import { StepSavings } from './steps/StepSavings.jsx';
import { StepDebts } from './steps/StepDebts.jsx';
import { StepEmergencyFund } from './steps/StepEmergencyFund.jsx';
import { StepRiskTolerance } from './steps/StepRiskTolerance.jsx';
import { StepGoals } from './steps/StepGoals.jsx';

const DEFAULT_DRAFT = {
  age: 0,
  monthlyIncome: 0,
  fixedExpenses: { total: 0, items: [] },
  variableExpenses: { total: 0, items: [] },
  currentSavings: 0,
  debts: [],
  emergencyFundBalance: 0,
  riskTolerance: '',
  goals: [],
};

export function OnboardingShell({ onComplete, initialDraft }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialDraft || DEFAULT_DRAFT);

  function update(key) {
    return (val) => setDraft(d => ({ ...d, [key]: val }));
  }

  const steps = [
    <StepAge value={draft.age} onChange={update('age')} onNext={() => setStep(1)} />,
    <StepIncome value={draft.monthlyIncome} onChange={update('monthlyIncome')} onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <StepFixedExpenses value={draft.fixedExpenses} onChange={update('fixedExpenses')} onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <StepVariableExpenses value={draft.variableExpenses} onChange={update('variableExpenses')} onNext={() => setStep(4)} onBack={() => setStep(2)} />,
    <StepSavings value={draft.currentSavings} onChange={update('currentSavings')} onNext={() => setStep(5)} onBack={() => setStep(3)} />,
    <StepDebts value={draft.debts} onChange={update('debts')} onNext={() => setStep(6)} onBack={() => setStep(4)} />,
    <StepEmergencyFund value={draft.emergencyFundBalance} onChange={update('emergencyFundBalance')} onNext={() => setStep(7)} onBack={() => setStep(5)} profile={draft} />,
    <StepRiskTolerance value={draft.riskTolerance} onChange={update('riskTolerance')} onNext={() => setStep(8)} onBack={() => setStep(6)} />,
    <StepGoals value={draft.goals} onChange={update('goals')} onNext={() => onComplete(draft)} onBack={() => setStep(7)} />,
  ];

  return steps[step];
}
