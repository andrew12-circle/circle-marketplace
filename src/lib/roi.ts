export interface ROIEstimate {
  appointments_est: number;
  contracts_est: number;
  gci_delta_est: number;
  timeframe_months: number;
}

export interface ROIInputs {
  avg_price_point: number;
  goal_gap: number; // Target volume - current volume
  time_window_months: number;
  current_volume: number;
}

export const estimateRoi = (inputs: ROIInputs): ROIEstimate => {
  const {
    avg_price_point,
    goal_gap,
    time_window_months,
    current_volume
  } = inputs;

  // Base assumptions for real estate agent performance
  const APPOINTMENT_TO_CONTRACT_RATE = 0.15; // 15% of appointments convert to contracts
  const AVERAGE_COMMISSION_RATE = 0.025; // 2.5% average commission
  const APPOINTMENTS_PER_MONTH_BASE = 8; // Base appointments per month for average agent

  // Calculate monthly appointment target based on goal gap
  const contracts_needed_monthly = goal_gap / time_window_months;
  const appointments_needed_monthly = contracts_needed_monthly / APPOINTMENT_TO_CONTRACT_RATE;
  
  // Current performance baseline
  const current_monthly_contracts = current_volume / 12;
  const current_monthly_appointments = current_monthly_contracts / APPOINTMENT_TO_CONTRACT_RATE;
  
  // Estimate improvement from tools/services
  const appointment_lift = Math.max(
    appointments_needed_monthly - current_monthly_appointments,
    APPOINTMENTS_PER_MONTH_BASE * 0.3 // Minimum 30% lift assumption
  );

  const appointments_est = Math.round(appointment_lift);
  const contracts_est = Math.round(appointments_est * APPOINTMENT_TO_CONTRACT_RATE);
  const gci_delta_est = Math.round(contracts_est * avg_price_point * AVERAGE_COMMISSION_RATE);

  return {
    appointments_est,
    contracts_est,
    gci_delta_est,
    timeframe_months: time_window_months
  };
};

export const formatROI = (roi: ROIEstimate): string => {
  if (roi.gci_delta_est > 10000) {
    return `$${Math.round(roi.gci_delta_est / 1000)}K`;
  }
  return `$${roi.gci_delta_est.toLocaleString()}`;
};

export const formatAppointments = (count: number): string => {
  return `+${count} appts/mo`;
};

export const formatContracts = (count: number): string => {
  return `+${count} deals`;
};