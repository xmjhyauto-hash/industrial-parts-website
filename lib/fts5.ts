import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// FTS5 setup script - run once to initialize full-text search
async function setupFTS5() {
  console.log('Setting up FTS5 full-text search...')

  // Create FTS5 virtual table
  await prisma.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE IF NOT EXISTS product_fts USING fts5(
      id,
      name,
      model,
      brand,
      description,
      content='Product',
      content_rowid='rowid'
    )
  `)
  console.log('Created product_fts virtual table')

  // Create triggers to keep FTS in sync with Product table
  // Drop existing triggers first if they exist
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS product_fts_insert
  `)
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS product_fts_update
  `)
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS product_fts_delete
  `)

  // Insert trigger
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER product_fts_insert AFTER INSERT ON Product BEGIN
      INSERT INTO product_fts(rowid, id, name, model, brand, description)
      VALUES (NEW.rowid, NEW.id, NEW.name, NEW.model, NEW.brand, NEW.description)
    END
  `)
  console.log('Created product_fts_insert trigger')

  // Update trigger
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER product_fts_update AFTER UPDATE ON Product BEGIN
      INSERT INTO product_fts(product_fts, rowid, id, name, model, brand, description)
      VALUES ('delete', OLD.rowid, OLD.id, OLD.name, OLD.model, OLD.brand, OLD.description)
    END
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER product_fts_update_rowid AFTER UPDATE ON Product BEGIN
      INSERT INTO product_fts(rowid, id, name, model, brand, description)
      VALUES (NEW.rowid, NEW.id, NEW.name, NEW.model, NEW.brand, NEW.description)
    END
  `)
  console.log('Created product_fts_update triggers')

  // Delete trigger
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER product_fts_delete AFTER DELETE ON Product BEGIN
      INSERT INTO product_fts(product_fts, rowid, id, name, model, brand, description)
      VALUES ('delete', OLD.rowid, OLD.id, OLD.name, OLD.model, OLD.brand, OLD.description)
    END
  `)
  console.log('Created product_fts_delete trigger')

  // Populate FTS table with existing products
  await prisma.$executeRawUnsafe(`
    INSERT INTO product_fts(rowid, id, name, model, brand, description)
    SELECT rowid, id, name, model, brand, description FROM Product
  `)
  console.log('Populated FTS table with existing products')

  console.log('FTS5 setup complete!')
}

setupFTS5()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
