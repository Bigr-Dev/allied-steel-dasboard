'use client'

export function createVehicleMarker(mapboxgl, vehicle, isSelected = false) {
  // Root container (Mapbox manages its transform here)
  const el = document.createElement('div')
  el.className = 'vehicle-marker'
  el.style.cssText = `
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // Inner visual node
  const inner = document.createElement('div')
  inner.className = 'marker-inner'
  inner.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid ${isSelected ? '#059669' : '#ffffff'};
    background-color: ${vehicle.Speed > 0 ? '#10b981' : '#ef4444'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  inner.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  `

  // Hover effects on the inner node
  inner.addEventListener('mouseenter', () => {
    inner.style.transform = 'scale(1.2)'
    inner.style.zIndex = '1000'
  })

  inner.addEventListener('mouseleave', () => {
    inner.style.transform = 'scale(1)'
    inner.style.zIndex = '1'
  })

  el.appendChild(inner)

  return new mapboxgl.Marker({ element: el, anchor: 'center' })
}

// export function createVehicleMarker(mapboxgl, vehicle, isSelected = false) {
//   // Create custom marker element
//   const el = document.createElement('div')
//   el.className = 'vehicle-marker'
//   el.style.cssText = `
//     width: 24px;
//     height: 24px;
//     border-radius: 50%;
//     border: 2px solid ${isSelected ? '#059669' : '#ffffff'};
//     background-color: ${vehicle.Speed > 0 ? '#10b981' : '#ef4444'};
//     box-shadow: 0 2px 4px rgba(0,0,0,0.2);
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: all 0.2s ease;
//   `

//   // Add truck icon
//   el.innerHTML = `
//     <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
//       <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
//     </svg>
//   `

//   // Add hover effect
//   el.addEventListener('mouseenter', () => {
//     el.style.transform = 'scale(1.2)'
//     el.style.zIndex = '1000'
//   })

//   el.addEventListener('mouseleave', () => {
//     el.style.transform = 'scale(1)'
//     el.style.zIndex = '1'
//   })

//   return new mapboxgl.Marker(el)
// }

export function parseRawTcpData(rawMessage) {
  // Parse the raw TCP message to extract multiple vehicle positions
  const vehicles = []
  const lines = rawMessage.split('\n').filter((line) => line.trim())

  lines.forEach((line) => {
    const parts = line.split('|')
    if (parts.length >= 6) {
      const plate = parts[0].replace('^', '')
      const speed = Number.parseInt(parts[1]) || 0
      const lat = Number.parseFloat(parts[2])
      const lng = Number.parseFloat(parts[3])
      const timestamp = parts[4]
      const driver = parts[6] || 'Unknown Driver'
      const location = parts[8] || 'Unknown Location'

      if (!isNaN(lat) && !isNaN(lng)) {
        vehicles.push({
          Plate: plate,
          Speed: speed,
          Latitude: lat,
          Longitude: lng,
          LocTime: timestamp,
          DriverName: driver,
          Geozone: location,
          Quality: parts[5] || '0',
        })
      }
    }
  })

  return vehicles
}
