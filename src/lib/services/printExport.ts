import { jsPDF } from 'jspdf';

export function exportCoursePng(canvas: HTMLCanvasElement, title: string): void {
	const link = document.createElement('a');
	link.download = `${title || 'course'}.png`;
	link.href = canvas.toDataURL('image/png');
	link.click();
}

export function exportCoursePdf(canvas: HTMLCanvasElement, title: string): void {
	const imgData = canvas.toDataURL('image/png');
	const pdf = new jsPDF({
		orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
		unit: 'px',
		format: [canvas.width, canvas.height]
	});
	pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
	pdf.save(`${title || 'course'}.pdf`);
}
