export const DEMO_STAGE_SEQUENCE = [
  'READY',
  'DONATION_POSTED',
  'VALIDATION',
  'MATCHING',
  'DRIVER_DISPATCH',
  'ROUTE_READY',
  'PICKUP_READY',
  'DELIVERY_IN_PROGRESS',
  'RESCUE_COMPLETED',
] as const;

export type DemoStage = typeof DEMO_STAGE_SEQUENCE[number];

export type DemoScenarioKey = 'successful' | 'infeasible' | 'expiring';

export type DemoScenario = {
  name: string;
  label: string;
  donor_name: string;
  donor_location: string;
  food_type: string;
  donation_quantity: number;
  servings: number;
  usable_minutes: number;
  recipient_name: string;
  recipient_capacity: number;
  recipient_need: number;
  driver_name: string;
  driver_vehicle: string;
  driver_capacity: number;
  driver_available: boolean;
  donor_latitude: number;
  donor_longitude: number;
  recipient_latitude: number;
  recipient_longitude: number;
  driver_latitude: number;
  driver_longitude: number;
};

const DEMO_SCENARIOS: Record<DemoScenarioKey, DemoScenario> = {
  successful: {
    name: 'Successful Rescue',
    label: 'SUCCESSFUL RESCUE',
    donor_name: 'Green Leaf Restaurant',
    donor_location: 'Demo Restaurant Location',
    food_type: 'vegetarian meals',
    donation_quantity: 40,
    servings: 40,
    usable_minutes: 120,
    recipient_name: 'Sunrise Community Shelter',
    recipient_capacity: 50,
    recipient_need: 35,
    driver_name: 'Alex',
    driver_vehicle: 'Van',
    driver_capacity: 60,
    driver_available: true,
    donor_latitude: 12.971,
    donor_longitude: 77.594,
    recipient_latitude: 12.979,
    recipient_longitude: 77.603,
    driver_latitude: 12.965,
    driver_longitude: 77.586,
  },
  infeasible: {
    name: 'No Feasible Rescue',
    label: 'NO FEASIBLE RESCUE',
    donor_name: 'Night Market Kitchen',
    donor_location: 'Low-capacity demo site',
    food_type: 'vegetarian meals',
    donation_quantity: 40,
    servings: 40,
    usable_minutes: 90,
    recipient_name: 'Harbor Shelter',
    recipient_capacity: 10,
    recipient_need: 8,
    driver_name: 'Unavailable Driver',
    driver_vehicle: 'Truck',
    driver_capacity: 10,
    driver_available: false,
    donor_latitude: 12.971,
    donor_longitude: 77.594,
    recipient_latitude: 12.985,
    recipient_longitude: 77.610,
    driver_latitude: 12.960,
    driver_longitude: 77.620,
  },
  expiring: {
    name: 'Expiring Donation',
    label: 'URGENT',
    donor_name: 'City Pantry',
    donor_location: 'Time-sensitive donor site',
    food_type: 'vegetarian meals',
    donation_quantity: 40,
    servings: 40,
    usable_minutes: 20,
    recipient_name: 'Riverside Shelter',
    recipient_capacity: 45,
    recipient_need: 35,
    driver_name: 'Alex',
    driver_vehicle: 'Van',
    driver_capacity: 60,
    driver_available: true,
    donor_latitude: 12.970,
    donor_longitude: 77.595,
    recipient_latitude: 12.978,
    recipient_longitude: 77.604,
    driver_latitude: 12.965,
    driver_longitude: 77.588,
  },
};

export const createDemoScenario = (scenarioKey: DemoScenarioKey = 'successful'): DemoScenario => ({
  ...DEMO_SCENARIOS[scenarioKey],
});

export const getDemoStageIndex = (stage: DemoStage): number => DEMO_STAGE_SEQUENCE.indexOf(stage);

export const getDemoProgress = (stage: DemoStage): { current: number; total: number } => {
  const current = getDemoStageIndex(stage);
  return { current, total: DEMO_STAGE_SEQUENCE.length - 1 };
};

export const stageSummary: Record<DemoStage, string> = {
  READY: 'Ready to start the synthetic rescue workflow.',
  DONATION_POSTED: 'Donation posted to the demo system.',
  VALIDATION: 'The donation is validated for time, capacity, and compatibility.',
  MATCHING: 'Recipient selection compares capacity, distance, urgency, and food fit.',
  DRIVER_DISPATCH: 'The driver is selected and dispatch begins.',
  ROUTE_READY: 'The route checks whether pickup and delivery can fit in the usable window.',
  PICKUP_READY: 'Driver is at the donor and pickup can proceed.',
  DELIVERY_IN_PROGRESS: 'Food is moving to the selected recipient.',
  RESCUE_COMPLETED: 'Impact is recorded after a successful completion.',
};
