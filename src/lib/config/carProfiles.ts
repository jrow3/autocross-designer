export interface CarProfile {
	id: string;
	label: string;
	latG: number; // steady-state lateral grip
	brakeG: number; // straight-line braking
	accelG0: number; // launch acceleration at v = 0
	topSpeedMph: number; // gearing-limited cap for the sim
}

export const CAR_PROFILES: CarProfile[] = [
	{ id: 'street', label: 'Street (~0.90g)', latG: 0.9, brakeG: 0.95, accelG0: 0.45, topSpeedMph: 75 },
	{ id: 'street-touring', label: 'Street Touring (~1.00g)', latG: 1.0, brakeG: 1.05, accelG0: 0.5, topSpeedMph: 80 },
	{ id: 'prepared', label: 'Prepared (~1.10g)', latG: 1.1, brakeG: 1.15, accelG0: 0.65, topSpeedMph: 85 }
];

export function carProfile(id: string): CarProfile {
	return CAR_PROFILES.find((p) => p.id === id) ?? CAR_PROFILES[0];
}
