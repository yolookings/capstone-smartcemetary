-- Cemetery Normalization: Structured cemetery, block, and plot management
-- Migration: cemetery_normalization
-- 
-- Creates normalized tables for cemetery location management and links
-- them to the existing makam table via plot_id.

-- ── 1. CEMETERIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cemeteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  map_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. CEMETERY BLOCKS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS cemetery_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cemetery_id UUID NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  map_coords JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cemetery_id, code)
);

-- ── 3. CEMETERY PLOTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cemetery_plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES cemetery_blocks(id) ON DELETE CASCADE,
  plot_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' 
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
  map_coords JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(block_id, plot_number)
);

-- ── 4. LINK TO EXISTING MAKAM TABLE ─────────────────────────
-- Add plot_id as nullable foreign key (keeps blok/nomor for backward compat)
ALTER TABLE makam ADD COLUMN IF NOT EXISTS plot_id UUID REFERENCES cemetery_plots(id) ON DELETE SET NULL;

-- ── 5. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cemetery_blocks_cemetery ON cemetery_blocks(cemetery_id);
CREATE INDEX IF NOT EXISTS idx_cemetery_plots_block ON cemetery_plots(block_id);
CREATE INDEX IF NOT EXISTS idx_cemetery_plots_status ON cemetery_plots(status);
CREATE INDEX IF NOT EXISTS idx_makam_plot_id ON makam(plot_id);

-- ── 6. SEED: TPU KEPUTIH ────────────────────────────────────
-- Insert the baseline cemetery
INSERT INTO cemeteries (id, name, code, address, description, map_config)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'TPU Keputih',
  'TPU_KEPUTIH',
  'Keputih, Kec. Sukolilo, Surabaya, Jawa Timur',
  'Tempat Pemakaman Umum Keputih — pemakaman utama Kota Surabaya',
  '{"viewBox": "0 0 800 600", "bgColor": "#f0f4f0", "roadColor": "#e2e8f0"}'
);

-- Seed blocks A-E with map coordinates for SVG rendering
-- Layout: 4 blocks on top row, 1 block spanning bottom row
INSERT INTO cemetery_blocks (id, cemetery_id, name, code, capacity, map_coords, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Blok A', 'A', 20, 
   '{"x": 20, "y": 20, "width": 170, "height": 260, "plotsPerRow": 5, "plotRows": 4, "padding": 10, "gap": 4}', 1),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Blok B', 'B', 20, 
   '{"x": 215, "y": 20, "width": 170, "height": 260, "plotsPerRow": 5, "plotRows": 4, "padding": 10, "gap": 4}', 2),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Blok C', 'C', 20, 
   '{"x": 410, "y": 20, "width": 170, "height": 260, "plotsPerRow": 5, "plotRows": 4, "padding": 10, "gap": 4}', 3),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Blok D', 'D', 20, 
   '{"x": 605, "y": 20, "width": 170, "height": 260, "plotsPerRow": 5, "plotRows": 4, "padding": 10, "gap": 4}', 4),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'Blok E', 'E', 20, 
   '{"x": 20, "y": 310, "width": 755, "height": 260, "plotsPerRow": 10, "plotRows": 2, "padding": 10, "gap": 4}', 5);

-- Generate 20 plots (1-20) for each of 5 blocks = 100 plots total
DO $$
DECLARE
  block_ids UUID[];
  bid UUID;
  i INTEGER;

  coords JSONB;
  block_coords JSONB;

  block_x INTEGER;
  block_y INTEGER;
  block_w INTEGER;
  block_h INTEGER;

  ppr INTEGER;
  prows INTEGER;
  pad INTEGER;
  gap INTEGER;

  plot_w INTEGER;
  plot_h INTEGER;

  col INTEGER;
  row INTEGER;

  px INTEGER;
  py INTEGER;
BEGIN
  block_ids := ARRAY[
    '00000000-0000-0000-0000-000000000101'::UUID,
    '00000000-0000-0000-0000-000000000102'::UUID,
    '00000000-0000-0000-0000-000000000103'::UUID,
    '00000000-0000-0000-0000-000000000104'::UUID,
    '00000000-0000-0000-0000-000000000105'::UUID
  ];

  FOREACH bid IN ARRAY block_ids
  LOOP
    SELECT map_coords
    INTO block_coords
    FROM cemetery_blocks
    WHERE id = bid;

    block_x := (block_coords->>'x')::INTEGER;
    block_y := (block_coords->>'y')::INTEGER;
    block_w := (block_coords->>'width')::INTEGER;
    block_h := (block_coords->>'height')::INTEGER;

    ppr := (block_coords->>'plotsPerRow')::INTEGER;
    prows := (block_coords->>'plotRows')::INTEGER;
    pad := (block_coords->>'padding')::INTEGER;
    gap := (block_coords->>'gap')::INTEGER;

    plot_w := (block_w - 2 * pad - (ppr - 1) * gap) / ppr;
    plot_h := (block_h - 2 * pad - (prows - 1) * gap) / prows;

    FOR i IN 1..20 LOOP
      col := (i - 1) % ppr;
      row := (i - 1) / ppr;

      px := block_x + pad + col * (plot_w + gap);
      py := block_y + pad + row * (plot_h + gap);

      coords := jsonb_build_object(
        'x', px,
        'y', py,
        'width', plot_w,
        'height', plot_h
      );

      INSERT INTO cemetery_plots (
        block_id,
        plot_number,
        status,
        map_coords
      )
      VALUES (
        bid,
        i::TEXT,
        'AVAILABLE',
        coords
      );
    END LOOP;
  END LOOP;
END $$;