// Starter centerlines as feet offsets around the template center. Templates are
// driving lines, not cone dumps — instantiate one, then run the generator.
export interface CourseTemplate {
	id: string;
	label: string;
	description: string;
	waypointOffsetsFt: [number, number][];
}

export const COURSE_TEMPLATES: CourseTemplate[] = [
	{
		id: 'u-shape',
		label: 'Practice U',
		description: 'Out, a wide 180, and back — the classic practice-day shape.',
		waypointOffsetsFt: [
			[-420, -350],
			[-420, 50],
			[-380, 220],
			[-250, 330],
			[0, 370],
			[250, 330],
			[380, 220],
			[420, 50],
			[420, -350]
		]
	},
	{
		id: 's-shape',
		label: 'Regional S',
		description: 'Sweeping esses with a straight on each end.',
		waypointOffsetsFt: [
			[-500, -350],
			[-500, -80],
			[-380, 60],
			[-160, 90],
			[0, 0],
			[160, -90],
			[380, -60],
			[500, 80],
			[500, 350]
		]
	},
	{
		id: 'switchback',
		label: 'Compact switchback',
		description: 'Three lanes of back-and-forth in a tight lot.',
		waypointOffsetsFt: [
			[-450, -280],
			[350, -280],
			[450, -190],
			[450, -90],
			[350, 0],
			[-350, 0],
			[-450, 90],
			[-450, 190],
			[-350, 280],
			[450, 280]
		]
	},
	{
		id: 'perimeter',
		label: 'Perimeter loop',
		description: 'A rounded lap of the whole lot, sweepers in every corner.',
		waypointOffsetsFt: [
			[-380, -300],
			[300, -300],
			[430, -220],
			[460, -60],
			[460, 160],
			[380, 280],
			[220, 320],
			[-260, 320],
			[-420, 250],
			[-470, 90],
			[-470, -120],
			[-400, -260]
		]
	}
];
