import 'dotenv/config';
import { cleanupAndInitDb } from '../src/lib/init-db';
import bcrypt from 'bcrypt';
import pool from '../src/lib/db';

/* ── TPU Keputih Geographic Coordinates ────────────────────
 * Real approximate coordinates for TPU Keputih, Surabaya.
 * Cemetery spans ~330m × 275m with 5 blocks (A-E), 20 plots each.
 * Blocks are arranged in a 2×2 grid (A-D) with E spanning bottom.
 * ──────────────────────────────────────────────────────────── */

const CEMETERY_ID = '00000000-0000-0000-0000-000000000001';
const CEMETERY_CENTER: [number, number] = [112.81075, -7.29385];
const CEMETERY_BOUNDARY: [number, number][] = [
  [112.8095, -7.2952],
  [112.8120, -7.2952],
  [112.8120, -7.2925],
  [112.8095, -7.2925],
];

interface BlockConfig {
  name: string;
  code: string;
  sort: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  ppr: number;  // plots per row
  rows: number;
}

const blockConfigs: BlockConfig[] = [
  {
    name: 'Blok A', code: 'A', sort: 1,
    minLat: -7.2935, maxLat: -7.2927,
    minLng: 112.8097, maxLng: 112.8105,
    ppr: 5, rows: 4,
  },
  {
    name: 'Blok B', code: 'B', sort: 2,
    minLat: -7.2935, maxLat: -7.2927,
    minLng: 112.8107, maxLng: 112.8115,
    ppr: 5, rows: 4,
  },
  {
    name: 'Blok C', code: 'C', sort: 3,
    minLat: -7.2943, maxLat: -7.2935,
    minLng: 112.8097, maxLng: 112.8105,
    ppr: 5, rows: 4,
  },
  {
    name: 'Blok D', code: 'D', sort: 4,
    minLat: -7.2943, maxLat: -7.2935,
    minLng: 112.8107, maxLng: 112.8115,
    ppr: 5, rows: 4,
  },
  {
    name: 'Blok E', code: 'E', sort: 5,
    minLat: -7.2951, maxLat: -7.2943,
    minLng: 112.8097, maxLng: 112.8115,
    ppr: 10, rows: 2,
  },
];

/** Compute a plot's center lat/lng within a block grid.
 * Returns GeoJSON-order coordinates: [lng, lat].
 */
function computePlotCoords(
  blk: BlockConfig,
  plotIndex: number, // 0-based
): { lng: number; lat: number } {
  const col = plotIndex % blk.ppr;
  const row = Math.floor(plotIndex / blk.ppr);
  const lat = blk.maxLat - (row + 0.5) * (blk.maxLat - blk.minLat) / blk.rows;
  const lng = blk.minLng + (col + 0.5) * (blk.maxLng - blk.minLng) / blk.ppr;
  return { lng, lat };
}

/** Polygon vertices for a block — GeoJSON [lng, lat] order */
function blockPolygon(blk: BlockConfig): [number, number][] {
  return [
    [blk.minLng, blk.minLat], // SW — [lng, lat]
    [blk.maxLng, blk.minLat], // SE
    [blk.maxLng, blk.maxLat], // NE
    [blk.minLng, blk.maxLat], // NW
  ];
}

/** Estimated area per cell in the block grid (for plot rendering size hint) */
function plotCellSize(blk: BlockConfig): { w: number; h: number } {
  return {
    w: (blk.maxLng - blk.minLng) / blk.ppr,
    h: (blk.maxLat - blk.minLat) / blk.rows,
  };
}

async function seed() {
  await cleanupAndInitDb();

  const client = await pool.connect();
  try {
    // ── Admin User ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@smartcemetery.com', hashedPassword, 'Super Admin', 'ADMIN']);

    // ── TPU Keputih Cemetery (with geo map_config) ──────────────
    await client.query(`
      INSERT INTO cemeteries (id, name, code, address, description, map_config)
      VALUES (
        $1,
        'TPU Keputih',
        'TPU_KEPUTIH',
        'Keputih, Kec. Sukolilo, Surabaya, Jawa Timur',
        'Tempat Pemakaman Umum Keputih',
        $2::jsonb
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        description = EXCLUDED.description,
        map_config = EXCLUDED.map_config;
    `, [
      CEMETERY_ID,
      JSON.stringify({
        center: CEMETERY_CENTER,
        zoom: 17,
        boundary: CEMETERY_BOUNDARY,
        maxZoom: 19,
      }),
    ]);

    // ── Cemetery Blocks (A-E with geo polygon coordinates) ──────
    for (const blk of blockConfigs) {
      const polygon = blockPolygon(blk);
      const centerLat = (blk.minLat + blk.maxLat) / 2;
      const centerLng = (blk.minLng + blk.maxLng) / 2;

      const blockGeoJson = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [polygon], // polygon is [[lng, lat], ...]
        },
        properties: {
          center: [centerLng, centerLat], // GeoJSON [lng, lat] order
          plotsPerRow: blk.ppr,
          plotRows: blk.rows,
        },
      };

      await client.query(`
        INSERT INTO cemetery_blocks (cemetery_id, name, code, capacity, map_coords, polygon, sort_order)
        VALUES (
          $1, $2, $3, 20,
          $4::jsonb, $5::jsonb,
          $6
        )
        ON CONFLICT (cemetery_id, code) DO UPDATE SET
          map_coords = EXCLUDED.map_coords,
          polygon = EXCLUDED.polygon,
          name = EXCLUDED.name,
          capacity = EXCLUDED.capacity,
          sort_order = EXCLUDED.sort_order;
      `, [
        CEMETERY_ID,
        blk.name, blk.code,
        JSON.stringify(blockGeoJson),
        JSON.stringify(blockGeoJson),
        blk.sort,
      ]);

      // Get block id
      const { rows: [{ id: blockId }] } = await client.query(
        `SELECT id FROM cemetery_blocks WHERE cemetery_id = $1 AND code = $2`,
        [CEMETERY_ID, blk.code]
      );

      // Generate plots 1-20 with geo coordinates
      for (let i = 1; i <= 20; i++) {
        const { lng, lat } = computePlotCoords(blk, i - 1);
        const cell = plotCellSize(blk);

        await client.query(`
          INSERT INTO cemetery_plots (block_id, plot_number, status, map_coords)
          VALUES ($1, $2, 'AVAILABLE', $3::jsonb)
          ON CONFLICT (block_id, plot_number) DO UPDATE SET
            map_coords = EXCLUDED.map_coords,
            status = EXCLUDED.status;
        `, [
          blockId,
          i.toString(),
          JSON.stringify({
            type: 'Point',
            coordinates: [lng, lat],  // GeoJSON is [lng, lat]
            properties: {
              cellWidth: cell.w,
              cellHeight: cell.h,
            },
          }),
        ]);
      }
    }

    console.log('Seeding completed successfully.');
    console.log('TPU Keputih with 5 blocks × 20 plots = 100 total plots.');
    console.log('Coordinates: center', CEMETERY_CENTER, 'zoom 17');
  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
