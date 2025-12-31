/**
 * Basic Usage Example
 */

import { InmovaClient } from '../src';

async function main() {
  // Initialize client
  const client = new InmovaClient({
    apiKey: process.env.INMOVA_API_KEY || 'sk_live_your_key_here',
  });

  console.log('🏠 Inmova SDK - Basic Usage Example\n');

  try {
    // 1. List properties
    console.log('📋 Listing properties...');
    const properties = await client.properties.list({
      limit: 5,
      status: 'AVAILABLE',
    });

    console.log(`Found ${properties.pagination.total} properties`);
    properties.data.forEach((p) => {
      console.log(`  - ${p.address}, ${p.city} (${p.price}€/month)`);
    });

    // 2. Create a new property
    console.log('\n➕ Creating new property...');
    const newProperty = await client.properties.create({
      address: 'Calle Ejemplo 123',
      city: 'Madrid',
      price: 1200,
      rooms: 3,
      bathrooms: 2,
      squareMeters: 85,
      type: 'APARTMENT',
      status: 'AVAILABLE',
      description: 'Beautiful apartment created via SDK',
    });

    console.log(`✅ Property created with ID: ${newProperty.id}`);

    // 3. Update the property
    console.log('\n✏️  Updating property...');
    const updated = await client.properties.update(newProperty.id, {
      price: 1300,
      description: 'Updated description via SDK',
    });

    console.log(`✅ Property updated. New price: ${updated.price}€`);

    // 4. Get single property
    console.log('\n🔍 Getting property details...');
    const fetched = await client.properties.get(newProperty.id);
    console.log(`✅ Fetched property: ${fetched.address}`);

    // 5. List API keys
    console.log('\n🔑 Listing API keys...');
    const apiKeys = await client.apiKeys.list();
    console.log(`Found ${apiKeys.length} API keys`);

    // 6. Create webhook
    console.log('\n🪝 Creating webhook...');
    const webhook = await client.webhooks.create({
      url: 'https://example.com/webhook',
      events: ['PROPERTY_CREATED', 'PROPERTY_UPDATED'],
      description: 'Test webhook created via SDK',
    });

    console.log(`✅ Webhook created with ID: ${webhook.id}`);
    console.log(`   Secret: ${webhook.secret} (save this!)`);

    // 7. List webhooks
    console.log('\n📡 Listing webhooks...');
    const webhooks = await client.webhooks.list();
    console.log(`Found ${webhooks.length} webhooks`);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await client.properties.delete(newProperty.id);
    await client.webhooks.delete(webhook.id);
    console.log('✅ Cleanup completed');
  } catch (error: any) {
    console.error('\n❌ Error:', error.error || error.message);
    console.error('   Status:', error.statusCode);
    console.error('   Code:', error.code);
  }
}

main();
