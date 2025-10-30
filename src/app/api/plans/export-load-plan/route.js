import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'

export const runtime = 'nodejs'

const TEMPLATE_NAME = 'load-plan-template.xlsx'
const TEMPLATE_PATH = (...segs) =>
  path.join(process.cwd(), 'public', 'templates', ...segs)
// Put this helper near the top of your route file
function stripSharedFormulas(ws) {
  // Walk every populated cell and remove shared-formula metadata
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value
      const isObj = v && typeof v === 'object'
      const hasShared =
        isObj &&
        (('sharedFormula' in v && v.sharedFormula) ||
          ('sharedType' in v && v.sharedType === 'shared') ||
          ('ref' in v && v.ref)) // exceljs internal for shared groups

      if (hasShared) {
        // Prefer cached result if present; otherwise clear the formula
        const result =
          v && 'result' in v && v.result != null
            ? v.result
            : cell.result != null
            ? cell.result
            : null

        cell.value = result // convert shared formula cell to its value
        // optional: keep number format if present
        // (cell.numFmt stays as-is)
      } else if (isObj && 'formula' in v && typeof v.formula === 'string') {
        // Non-shared formula is fine; keep as-is (or keep result if you prefer)
        // cell.value = { formula: v.formula, result: v.result ?? cell.result };
      }
    })
  })

  // Extra safety: nuke worksheet-level shared formula cache if present
  if (ws.model && Array.isArray(ws.model.sharedFormulas)) {
    ws.model.sharedFormulas = []
  }
}

// helpers (put near top of file)
function sanitizeFilename(name) {
  // Replace Windows/macOS illegal chars and slashes with a dash
  const illegal = /[<>:"/\\|?*\u0000-\u001F]/g // control chars + reserved
  let n = (name || 'load-plan-populated').replace(illegal, '-')
  // collapse whitespace and dashes
  n = n.replace(/\s+/g, ' ').trim().replace(/-+/g, '-')
  // limit length
  if (n.length > 120) n = n.slice(0, 120)
  // ensure not empty
  if (!n) n = 'load-plan-populated'
  return n
}
function ensureXlsx(name) {
  return name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`
}
function encodeRFC5987(str) {
  return encodeURIComponent(str).replace(/['()]/g, escape).replace(/\*/g, '%2A')
}

export async function POST(request) {
  try {
    const assignment = await request.json()
    const units = Array.isArray(assignment?.assigned_units)
      ? assignment.assigned_units
      : []

    // 1) Load the template workbook and use the FIRST sheet directly
    const templatePath = TEMPLATE_PATH(TEMPLATE_NAME)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(templatePath)
    const ws = wb.worksheets[0]
    if (!ws) {
      return new Response(JSON.stringify({ error: 'Template sheet missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ------ Helpers ------
    const getVal = (cell) => (cell?.value ?? '').toString().trim().toLowerCase()
    const findRowByLabel = (label) => {
      const L = String(label || '')
        .trim()
        .toLowerCase()
      for (let r = 1; r <= ws.rowCount; r++) {
        if (getVal(ws.getCell(r, 1)) === L) return r
      }
      return null
    }

    // Locate template anchor rows via labels in Column A (spelling variants included)
    const rowIdx = {
      payloadTons: findRowByLabel('pay load (t)') ?? findRowByLabel('pay load'),
      tonsLoaded:
        findRowByLabel('tons loaded (t)') ?? findRowByLabel('tons loaded'),
      diffKg: findRowByLabel('diff (kg)') ?? findRowByLabel('diff'),
      vehicleMass:
        findRowByLabel('vehicle mass (kg)') ?? findRowByLabel('vehicle mass'),
      utilPct:
        findRowByLabel('% utilization') ?? findRowByLabel('% untilization'),
      vehicleType:
        findRowByLabel('vehicle type') ?? findRowByLabel('vehicle type '),
      vehicleReg:
        findRowByLabel('vehicle registration') ??
        findRowByLabel('vehicle registration '),
      fleetNumber:
        findRowByLabel('fleet number') ?? findRowByLabel('fleet number '),
      length: findRowByLabel('length'),
      backboard: findRowByLabel('backboard'),
      trailerReg:
        findRowByLabel('trailor registration') ??
        findRowByLabel('trailer registration'),
      driverName:
        findRowByLabel('driver name') ?? findRowByLabel('driver name '),
    }

    // Orders section: first "Customer" row (Column A) and 7-row block size
    const firstCustomerRow =
      findRowByLabel('customer') ??
      findRowByLabel('Customer') ??
      findRowByLabel('CUSTOMER')
    const blockSize = 7 // Customer, Del Area, Sales order, Product, Comments, Sales person, Mass

    // Detect how many blocks exist under the first Customer (template capacity)
    let maxBlocks = 0
    if (firstCustomerRow) {
      let probe = firstCustomerRow
      while (probe + blockSize - 1 <= ws.rowCount) {
        const lbl = getVal(ws.getCell(probe, 1))
        if (lbl !== 'customer') break
        maxBlocks++
        probe += blockSize
      }
      if (maxBlocks === 0) maxBlocks = 12 // conservative fallback
    }

    // Optional: clear previous data for columns we will fill (keeps formatting/formulas)
    const startCol = 2 // Column B
    const endCol = startCol + Math.max(units.length, 1) - 1
    const clearRows = (indices = []) => {
      indices.forEach((r) => {
        if (!r) return
        for (let c = startCol; c <= endCol; c++) {
          const cell = ws.getCell(r, c)
          // Don't wipe formulas – only clear plain/static values
          const v = cell.value
          const isFormulaObj =
            v &&
            typeof v === 'object' &&
            ('formula' in v || 'sharedFormula' in v)
          if (!isFormulaObj) cell.value = null
        }
      })
    }
    // Clear top rows we will repopulate
    clearRows([
      rowIdx.payloadTons,
      rowIdx.tonsLoaded,
      rowIdx.diffKg,
      rowIdx.vehicleMass,
      rowIdx.utilPct,
      rowIdx.vehicleType,
      rowIdx.vehicleReg,
      rowIdx.fleetNumber,
      rowIdx.length,
      rowIdx.backboard,
      rowIdx.trailerReg,
      rowIdx.driverName,
    ])
    // Clear orders area
    if (firstCustomerRow && maxBlocks) {
      for (let b = 0; b < maxBlocks; b++) {
        const base = firstCustomerRow + b * blockSize
        clearRows([
          base + 0,
          base + 1,
          base + 2,
          base + 3,
          base + 4,
          base + 5,
          base + 6,
        ])
      }
    }

    // ------ Sort units by capacity percentage (least full to most full) ------
    const sortedUnits = units.slice().sort((a, b) => {
      const aPercentage = (a.used_capacity_kg / a.capacity_kg) * 100
      const bPercentage = (b.used_capacity_kg / b.capacity_kg) * 100
      return aPercentage - bPercentage
    })

    // ------ Populate: one unit per column ------
    let col = startCol
    for (const unit of sortedUnits) {
      const capacity_kg = Number(unit?.capacity_kg || 0)
      const used_kg = Number(unit?.used_capacity_kg || 0)
      const diff_kg = capacity_kg - used_kg // allow negative if overloaded
      const util = capacity_kg ? used_kg / capacity_kg : 0

      // Rigid vs Horse+Trailer mapping (per your payload)
      const isRigid = (unit?.unit_type || '').toLowerCase() === 'rigid'
      const rigidPlate = unit?.rigid?.plate || ''
      const rigidFleet = unit?.rigid?.fleet_number || ''
      const horsePlate = unit?.horse?.plate || ''
      const horseFleet = unit?.horse?.fleet_number || ''
      const trailerPlate = unit?.trailer?.plate || ''

      const registration = isRigid ? rigidPlate : horsePlate
      const fleet = isRigid ? rigidFleet : horseFleet
      const driver = unit?.driver_name ? unit.driver_name.split(' ')[0] : ''
      const unitType = unit?.unit_type || ''

      // Top block writes (do not touch formatting; set only values/numFmt)
      if (rowIdx.payloadTons) {
        const c = ws.getCell(rowIdx.payloadTons, col)
        c.value = capacity_kg / 1000
        c.numFmt = '0.00'
      }
      if (rowIdx.tonsLoaded) {
        const c = ws.getCell(rowIdx.tonsLoaded, col)
        c.value = used_kg / 1000
        c.numFmt = '0.00'
      }
      if (rowIdx.diffKg) {
        const c = ws.getCell(rowIdx.diffKg, col)
        c.value = diff_kg
        c.numFmt = '0'
      }
      if (rowIdx.vehicleMass) {
        ws.getCell(rowIdx.vehicleMass, col).value = 0
      }
      if (rowIdx.utilPct) {
        const c = ws.getCell(rowIdx.utilPct, col)
        c.value = util
        c.numFmt = '0.00%'
      }
      if (rowIdx.vehicleType)
        ws.getCell(rowIdx.vehicleType, col).value = unitType.toUpperCase()
      if (rowIdx.vehicleReg)
        ws.getCell(rowIdx.vehicleReg, col).value = registration
      if (rowIdx.fleetNumber) ws.getCell(rowIdx.fleetNumber, col).value = fleet
      if (rowIdx.driverName) ws.getCell(rowIdx.driverName, col).value = driver

      if (rowIdx.length)
        ws.getCell(rowIdx.length, col).value = unit?.length || ''
      if (rowIdx.backboard)
        ws.getCell(rowIdx.backboard, col).value = unit?.backboard || ''
      if (rowIdx.trailerReg)
        ws.getCell(rowIdx.trailerReg, col).value = trailerPlate

      // Orders (Customer → Mass) in 7-row blocks
      if (firstCustomerRow && maxBlocks) {
        const customers = Array.isArray(unit?.customers) ? unit.customers : []
        const orderRows = []
        customers.forEach((cust) => {
          const customer = cust?.customer_name || ''
          const area = cust?.suburb_name || ''
          const orders = Array.isArray(cust?.orders) ? cust.orders : []
          orders.forEach((order) => {
            const so =
              Array.isArray(order.items) && order.items.length
                ? order.items[0].order_number || ''
                : ''
            const descs = Array.isArray(order.items)
              ? order.items.map((it) => it?.description || '').filter(Boolean)
              : []
            const product = descs.join('; ').slice(0, 200)
            const comments = order?.comments || ''
            const salesPerson = order?.sales_person || ''
            const massKg = Number(order?.total_assigned_weight_kg || 0)

            orderRows.push({
              customer,
              area,
              so,
              product,
              comments,
              salesPerson,
              massKg,
            })
          })
        })

        const n = Math.min(orderRows.length, maxBlocks)
        for (let i = 0; i < n; i++) {
          const base = firstCustomerRow + i * blockSize
          ws.getCell(base + 0, col).value = orderRows[i].customer // Customer
          ws.getCell(base + 1, col).value = orderRows[i].area // Del Area
          ws.getCell(base + 2, col).value = orderRows[i].so // Sales order
          ws.getCell(base + 3, col).value = orderRows[i].product // Product
          ws.getCell(base + 4, col).value = orderRows[i].comments // Comments
          ws.getCell(base + 5, col).value = orderRows[i].salesPerson // Sales person
          ws.getCell(base + 6, col).value = orderRows[i].massKg // Mass
        }
      }

      col++
    }
    stripSharedFormulas(ws)

    // 2) Return the filled workbook (first sheet populated)
    // const buffer = await wb.xlsx.writeBuffer()

    // Build a safe filename from assignment?.plan?.notes
    const rawName = assignment?.plan?.notes || 'load-plan-populated'
    // tip: convert slashes specifically for dates like 23/10/2025
    const normalized = rawName.replace(/\//g, '-')
    const safeBase = sanitizeFilename(normalized)
    const fileName = ensureXlsx(safeBase)

    // ...after stripSharedFormulas(ws)
    const buffer = await wb.xlsx.writeBuffer()

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Both filename (legacy) and filename* (RFC 5987) for broad compatibility
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeRFC5987(
          fileName
        )}`,
        'Cache-Control': 'no-store',
      },
    })

    // return new Response(Buffer.from(buffer), {
    //   status: 200,
    //   headers: {
    //     'Content-Type':
    //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    //     'Content-Disposition': `attachment; filename=${
    //       assignment?.plan?.notes
    //         ? `${assignment?.plan?.notes}.xlsx`
    //         : 'load-plan-populated.xlsx'
    //     }`,
    //     'Cache-Control': 'no-store',
    //   },
    // })
  } catch (err) {
    console.error('Error generating plan:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * GET: returns the raw template, unchanged
 */
export async function GET() {
  try {
    const filePath = TEMPLATE_PATH(TEMPLATE_NAME)
    try {
      const stat = await fs.promises.stat(filePath)
      if (!stat.isFile()) throw new Error('Not a file')
    } catch {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const fileBuffer = await fs.promises.readFile(filePath)

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${TEMPLATE_NAME}"`,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Error exporting template:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
