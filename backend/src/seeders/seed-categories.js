const { Category } = require('../models');

async function seedCategories() {
  try {
    // First check if categories already exist
    const existingCategories = await Category.count();
    
    if (existingCategories > 0) {
      console.log('Categories already exist, skipping seeding');
      return;
    }
    
    // Create parent categories
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      order: 1
    });
    
    const vehicles = await Category.create({
      name: 'Vehicles',
      slug: 'vehicles',
      description: 'Cars, motorcycles, and other vehicles',
      isActive: true,
      order: 2
    });
    
    const fashion = await Category.create({
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      isActive: true,
      order: 3
    });
    
    const homeGarden = await Category.create({
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Furniture, home decor, and garden supplies',
      isActive: true,
      order: 4
    });
    
    // Create subcategories
    await Category.bulkCreate([
      {
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: electronics.id,
        isActive: true,
        order: 1
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        parentId: electronics.id,
        isActive: true,
        order: 2
      },
      {
        name: 'Cars',
        slug: 'cars',
        parentId: vehicles.id,
        isActive: true,
        order: 1
      },
      {
        name: 'Motorcycles',
        slug: 'motorcycles',
        parentId: vehicles.id,
        isActive: true,
        order: 2
      },
      {
        name: 'Men\'s Clothing',
        slug: 'mens-clothing',
        parentId: fashion.id,
        isActive: true,
        order: 1
      },
      {
        name: 'Women\'s Clothing',
        slug: 'womens-clothing',
        parentId: fashion.id,
        isActive: true,
        order: 2
      },
      {
        name: 'Furniture',
        slug: 'furniture',
        parentId: homeGarden.id,
        isActive: true,
        order: 1
      }
    ]);
    
    console.log('✅ Categories seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedCategories()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed categories:', error);
      process.exit(1);
    });
}

module.exports = seedCategories; 