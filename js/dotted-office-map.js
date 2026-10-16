(() => {
  const map = document.getElementById('wm-dotted-world-map');
  const dotsLayer = document.getElementById('wm-map-dots');
  const markersLayer = document.getElementById('wm-office-markers');
  if (!map || !dotsLayer || !markersLayer) return;

  const width = 1200;
  const height = 560;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const project = (longitude, latitude) => ({
    x: ((longitude + 180) / 360) * width,
    y: ((90 - latitude) / 180) * height,
  });

  // Simplified continent outlines are sampled into an alternating dotted grid.
  const land = [
    [
      [-168, 70], [-158, 68], [-150, 61], [-140, 59], [-134, 56], [-130, 51],
      [-125, 49], [-123, 42], [-117, 32], [-111, 31], [-108, 26], [-104, 29],
      [-97, 25], [-91, 18], [-87, 16], [-83, 9], [-78, 8], [-77, 16],
      [-81, 25], [-80, 30], [-76, 35], [-72, 41], [-66, 45], [-60, 51],
      [-65, 57], [-72, 61], [-75, 68], [-84, 72], [-96, 74], [-108, 72],
      [-119, 75], [-130, 71], [-141, 69], [-151, 73], [-160, 70],
    ],
    [[-73, 60], [-60, 59], [-49, 60], [-40, 67], [-25, 74], [-30, 81], [-43, 84], [-55, 82], [-65, 75]],
    [
      [-81, 12], [-74, 9], [-68, 11], [-61, 7], [-51, 2], [-48, -5], [-40, -10],
      [-35, -6], [-39, -18], [-45, -24], [-49, -30], [-54, -35], [-58, -40],
      [-63, -52], [-70, -55], [-76, -40], [-73, -20], [-78, -5],
    ],
    [
      [-10, 36], [-8, 43], [-4, 48], [-10, 54], [-5, 58], [7, 58], [17, 55],
      [24, 60], [34, 63], [36, 69], [51, 70], [61, 66], [72, 72], [86, 74],
      [101, 71], [121, 72], [141, 68], [160, 68], [179, 66], [179, 56],
      [170, 54], [160, 52], [153, 48], [146, 46], [141, 42], [135, 38],
      [130, 34], [126, 28], [121, 24], [115, 21], [109, 18], [105, 10],
      [101, 5], [96, 7], [91, 19], [85, 23], [80, 8], [77, 8], [74, 19],
      [69, 25], [60, 25], [55, 30], [48, 32], [45, 38], [40, 43], [30, 42],
      [25, 38], [18, 37], [12, 39], [7, 36], [0, 37], [-6, 35], [-10, 36],
    ],
    [[-17, 35], [-5, 36], [10, 37], [24, 32], [33, 30], [40, 13], [51, 11], [44, 1], [41, -10], [35, -19], [32, -29], [24, -35], [18, -33], [14, -22], [10, -9], [5, 3], [-5, 5], [-12, 11], [-17, 19], [-15, 28]],
    [[35, 30], [43, 32], [53, 26], [57, 22], [55, 16], [49, 12], [42, 15], [39, 24]],
    [[113, -11], [121, -10], [130, -12], [138, -16], [147, -16], [153, -25], [150, -38], [143, -39], [135, -34], [128, -33], [116, -35], [113, -26]],
    [[130, 32], [134, 33], [138, 36], [141, 41], [145, 44], [143, 46], [139, 43], [136, 39], [133, 36]],
    [[95, 5], [101, 6], [107, 4], [115, 1], [120, -3], [119, -8], [113, -8], [108, -6], [104, -2], [99, -1]],
    [[109, 7], [117, 7], [125, 4], [130, 0], [127, -5], [120, -7], [114, -4]],
    [[47, -13], [50, -16], [49, -24], [46, -26], [44, -20]],
    [[-11, 51], [-6, 50], [-5, 55], [-8, 59], [-11, 57]],
    [[-10, 52], [-6, 52], [-6, 55], [-9, 55]],
    [[166, -34], [174, -36], [178, -40], [174, -46], [168, -45], [166, -40]],
  ].map((polygon) => polygon.map(([longitude, latitude]) => project(longitude, latitude)));

  const contains = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const a = polygon[i];
      const b = polygon[j];
      const crosses = (a.y > point.y) !== (b.y > point.y)
        && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
      if (crosses) inside = !inside;
    }
    return inside;
  };

  const dotFragment = document.createDocumentFragment();
  const spacing = 13;
  let row = 0;
  for (let y = 17; y < height - 12; y += spacing) {
    const offset = row % 2 ? spacing / 2 : 0;
    for (let x = 11 + offset; x < width - 8; x += spacing) {
      const point = { x, y };
      if (!land.some((polygon) => contains(point, polygon))) continue;

      const dot = document.createElementNS(svgNamespace, 'circle');
      dot.setAttribute('class', 'wm-map-dot');
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));
      dot.setAttribute('r', '2.2');
      dot.setAttribute('opacity', (0.78 + (((x * 7 + y * 11) % 20) / 100)).toFixed(2));
      dotFragment.appendChild(dot);
    }
    row += 1;
  }
  dotsLayer.appendChild(dotFragment);

  const offices = [
    { id: 'thrissur', name: 'Thrissur, India', latitude: 10.5276, longitude: 76.2144, offsetX: -6, offsetY: -5 },
    { id: 'kochi', name: 'Kochi, India', latitude: 9.9312, longitude: 76.2673, offsetX: 6, offsetY: 5 },
    { id: 'bangalore', name: 'Bangalore, India', latitude: 12.9716, longitude: 77.5946 },
    { id: 'doha', name: 'Doha, Qatar', latitude: 25.2854, longitude: 51.531, offsetX: -3, offsetY: -4 },
    { id: 'dubai', name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708, offsetX: 3, offsetY: 4 },
    { id: 'dublin', name: 'Dublin, Ireland', latitude: 53.3498, longitude: -6.2603 },
    { id: 'london', name: 'London, United Kingdom', latitude: 51.5072, longitude: -0.1276 },
  ];

  const markerFragment = document.createDocumentFragment();
  offices.forEach((office) => {
    const position = project(office.longitude, office.latitude);
    const marker = document.createElementNS(svgNamespace, 'g');
    marker.setAttribute('class', 'wm-office-marker');
    marker.setAttribute('data-office', office.id);
    marker.setAttribute('transform', `translate(${(position.x + (office.offsetX || 0)).toFixed(1)} ${(position.y + (office.offsetY || 0)).toFixed(1)})`);

    const title = document.createElementNS(svgNamespace, 'title');
    title.textContent = office.name;

    const halo = document.createElementNS(svgNamespace, 'circle');
    halo.setAttribute('class', 'wm-office-marker-halo');
    halo.setAttribute('r', '10');

    const core = document.createElementNS(svgNamespace, 'circle');
    core.setAttribute('class', 'wm-office-marker-core');
    core.setAttribute('r', '4.5');

    marker.append(title, halo, core);
    markerFragment.appendChild(marker);
  });
  markersLayer.appendChild(markerFragment);

  const locationButtons = document.querySelectorAll('.wm-office-location[data-office]');
  locationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const officeId = button.dataset.office;
      const isAlreadyActive = button.classList.contains('is-active');

      locationButtons.forEach((locationButton) => {
        const isActive = !isAlreadyActive && locationButton.dataset.office === officeId;
        locationButton.classList.toggle('is-active', isActive);
        locationButton.setAttribute('aria-pressed', String(isActive));
      });
      markersLayer.querySelectorAll('.wm-office-marker').forEach((marker) => {
        marker.classList.toggle('is-active', !isAlreadyActive && marker.dataset.office === officeId);
      });
    });
  });
})();
