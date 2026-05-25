export function initRadarChart(containerSelector, data) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 600 600');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    
    const centerX = 300;
    const centerY = 300;
    const maxRadius = 230;
    const levels = 5;
    
    // Create defs for glow effect
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svg.appendChild(defs);
    
    // Calculate angle for each axis
    const angleStep = (2 * Math.PI) / data.length;
    
    // Draw background grid levels
    for (let level = 1; level <= levels; level++) {
        const radius = (maxRadius / levels) * level;
        const points = [];
        
        for (let i = 0; i < data.length; i++) {
            const angle = (angleStep * i) - (Math.PI / 2);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            points.push(`${x},${y}`);
        }
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points.join(' '));
        polygon.setAttribute('fill', 'none');
        polygon.setAttribute('stroke', level === levels ? '#666' : '#414141ff');
        polygon.setAttribute('stroke-width', level === levels ? '2' : '1');
        polygon.setAttribute('opacity', '0.8');
        svg.appendChild(polygon);
    }
    
    // Draw axis lines
    for (let i = 0; i < data.length; i++) {
        const angle = (angleStep * i) - (Math.PI / 2);
        const x = centerX + Math.cos(angle) * maxRadius;
        const y = centerY + Math.sin(angle) * maxRadius;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centerX);
        line.setAttribute('y1', centerY);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0.5');
        svg.appendChild(line);
    }
    
    // Calculate data points
    const dataPoints = [];
    for (let i = 0; i < data.length; i++) {
        const angle = (angleStep * i) - (Math.PI / 2);
        const value = Math.max(0, Math.min(100, data[i].value));
        const radius = (maxRadius * value) / 100;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        dataPoints.push({ x, y, value, label: data[i].label });
    }
    
    // Draw data area (filled polygon)
    const dataPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const points = dataPoints.map(point => `${point.x},${point.y}`).join(' ');
    dataPolygon.setAttribute('points', points);
    dataPolygon.setAttribute('fill', '#32C743');
    dataPolygon.setAttribute('fill-opacity', '0.15');
    dataPolygon.setAttribute('stroke', '#32C743');
    dataPolygon.setAttribute('stroke-width', '2');
    svg.appendChild(dataPolygon);
    
    // Draw data points with hover effects
    dataPoints.forEach((point, index) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#32C743');
        circle.setAttribute('stroke', 'none');
        circle.style.cursor = 'pointer';
        
        // Hover events
        circle.addEventListener('mouseenter', (e) => {
            circle.setAttribute('r', '6');

        });
        
        circle.addEventListener('mouseleave', () => {
            circle.setAttribute('r', '4');

        });
        
        svg.appendChild(circle);
    });
    
    // Add labels with text wrapping
    for (let i = 0; i < data.length; i++) {
        const angle = (angleStep * i) - (Math.PI / 2);
        let labelRadius = maxRadius + 45;
        
        // Adjust label radius ONLY for "Research & Writing" and "Systems & Networking"
        if (data[i].label === "Research & Writing" || data[i].label === "Systems & Networking") {
            labelRadius = maxRadius + 23; // Bring these specific labels closer to center
        }
        
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        
        // Create a text group for multi-line text
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Split the label into words for wrapping
        const words = data[i].label.toUpperCase().split(' ');
        const maxWordsPerLine = 2; // Maximum words per line
        const lines = [];
        
        for (let j = 0; j < words.length; j += maxWordsPerLine) {
            lines.push(words.slice(j, j + maxWordsPerLine).join(' '));
        }

        let textAnchor = 'middle';

        // Create text elements for each line
        lines.forEach((line, lineIndex) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y + (lineIndex - (lines.length - 1) / 2) * 18);
            text.setAttribute('text-anchor', textAnchor);
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#b8b8b8ff');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('class', 'radar-label'); // Add class for responsive styling
            text.textContent = line;
            textGroup.appendChild(text);
        });
        
        svg.appendChild(textGroup);
    }
    
    container.appendChild(svg);
}

export function updateRadarChart(containerSelector, newData) {
    initRadarChart(containerSelector, newData);
}
