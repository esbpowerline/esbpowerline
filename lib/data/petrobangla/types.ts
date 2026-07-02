export type ParseStatus = 'ok' | 'partial' | 'failed';

export type AudienceMode = 'simple' | 'analyst' | 'investor' | 'researcher';

export interface PetrobanglaIndexDay {
  date: string;
  date_label: string;
  json_file: string;
  field_count: number;
  plant_count: number;
  grand_total_gas_mmcfd: number;
  parse_status: ParseStatus;
  agent_summary: string;
}

export interface PetrobanglaIndex {
  schema: string;
  generated_at: string;
  total_days: number;
  days: PetrobanglaIndexDay[];
}

export interface PetrobanglaTimelineDay {
  date: string;
  parse_status: ParseStatus;
  quarantined: boolean;
  total_gas: number;
  domestic_gas: number;
  lng_gas: number;
  bibiyana_gas: number;
  producing_wells: number;
  power_demand: number | null;
  power_supply: number | null;
  power_fulfillment_pct: number | null;
  fertilizer_demand: number | null;
  fertilizer_supply: number | null;
  others_mmcfd: number | null;
  major_fields?: Record<string, number>;
}

export interface PetrobanglaTimelineSummary {
  generated_at: string;
  total_days: number;
  ok_days: number;
  peak: { date: string; gas: number } | null;
  low: { date: string; gas: number } | null;
  days: PetrobanglaTimelineDay[];
}

export interface ProductionField {
  record_type: string;
  id: string;
  company: string;
  company_code: string;
  operator: string | null;
  field: string;
  producing_wells: number;
  capacity_mmcfd: number;
  gas_mmcfd: number;
  condensate_bbld: number;
  pct_of_total_capacity?: number;
  pct_of_total_production?: number;
}

export interface PowerPlant {
  name: string;
  demand_mmcfd: number | null;
  supply_mmcfd: number | null;
}

export interface DistributionCompany {
  company: string;
  company_code: string;
  power_plants: PowerPlant[];
  power_demand_mmcfd: number;
  power_supply_mmcfd: number;
  fertilizer: { company: string | null; demand_mmcfd: number; supply_mmcfd: number };
  others_supplementary_mmcfd: number;
  total_mmcfd: number;
}

export type DistributionGrandTotal = {
  power_demand_mmcfd: number;
  power_supply_mmcfd: number;
  fertilizer_demand_mmcfd: number;
  fertilizer_supply_mmcfd: number;
  others_supplementary_mmcfd: number;
  total_mmcfd: number;
};

export interface DistributionSummary {
  /** Canonical totals — present on newer parses */
  grand_total?: DistributionGrandTotal;
  /** Legacy parser alias used on many 2025–2026 daily files */
  total_?: DistributionGrandTotal & { extra?: number | null };
  pct_of_total_distribution: {
    power_supply_mmcfd: number | null;
    fertilizer_supply_mmcfd: number | null;
    others_supplementary_mmcfd: number | null;
    total_mmcfd: number | null;
  };
}

export interface PetrobanglaDaily {
  $schema: string;
  meta: {
    parse_status: ParseStatus;
    agent_summary: string;
    source_pdf: string;
    source_filename?: string;
    warnings: string[];
    parsed_at?: string;
  };
  report: {
    period: string;
    report_date_start: string;
    report_date_end: string;
    report_date_label: string;
    month_label?: string;
  };
  production: {
    fields: ProductionField[];
    grand_total: ProductionField;
    field_count: number;
  };
  distribution: {
    companies: DistributionCompany[];
    summary: DistributionSummary;
  };
  validation?: {
    reconciled: boolean;
  };
  entities?: Array<{ type: string; name: string; id: string }>;
}

export interface ArchiveKpis {
  stressScore: number;
  stressColor: 'green' | 'amber' | 'red';
  totalGas: number;
  totalGasDeltaYear: number | null;
  totalGasDeltaPeak: number | null;
  totalGasDeltaBaseline: number;
  powerFulfillmentPct: number;
  powerDemand: number;
  powerSupply: number;
  lngSharePct: number;
  lngGasMmcfd: number;
  domesticGas: number;
  domesticDeltaBaseline: number;
  activeWells: number;
  bibiyanaGas: number;
  bibiyanaDomesticSharePct: number;
}

export interface PetrobanglaLiveWeekBundle {
  generated_at: string;
  live_week_count: number;
  latest_date: string | null;
  latest_label: string | null;
  index_entries: PetrobanglaIndexDay[];
  days: PetrobanglaDaily[];
}

export interface LiveWeekKpis {
  latestGas: number;
  latestLabel: string;
  latestDate: string;
  latestGasDelta: number | null;
  weekAvgGas: number;
  powerFulfillmentPct: number;
  powerSupply: number;
  powerDemand: number;
  lngSharePct: number;
  lngGasMmcfd: number;
  weekVolatility: number;
  weekMinGas: number;
  weekMaxGas: number;
  bibiyanaGas: number;
  bibiyanaWells: number;
}

export class QuarantinedDayError extends Error {
  constructor(public date: string) {
    super(`Archive day ${date} is quarantined or failed parse`);
    this.name = 'QuarantinedDayError';
  }
}