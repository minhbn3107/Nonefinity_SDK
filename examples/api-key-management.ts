/**
 * API Key Management Example
 * Demonstrates how to create and manage API keys
 */

import { NonefinityClient } from "../src/index";

async function main() {
  // STEP 1: Initialize with JWT token for API key management
  // (This is typically done from your dashboard or admin interface)
  console.log("📋 API Key Management Demo\n");

  const adminClient = new NonefinityClient({
    apiUrl: "http://localhost:8000",
    getAuthToken: async () => {
      // In a real app, get this from your auth system (e.g., Clerk)
      return "your-jwt-token-here";
    },
    debug: true,
  });

  try {
    // STEP 2: Create a new API key
    console.log("🔑 Creating new API key...");
    const createResp = await adminClient.createAPIKey({
      name: "Production Website Integration",
      expires_in_days: 365, // Expires in 1 year
      permissions: ["chat:read", "chat:write"],
    });

    if (!createResp.success || !createResp.data) {
      console.error("❌ Failed to create API key:", createResp.error);
      return;
    }

    const apiKey = createResp.data.api_key;
    const keyId = createResp.data.id;

    console.log("✅ API key created successfully!");
    console.log(`   Name: ${createResp.data.name}`);
    console.log(`   Key: ${apiKey}`);
    console.log(`   Prefix: ${createResp.data.key_prefix}...`);
    console.log(`   Expires: ${createResp.data.expires_at || "Never"}`);
    console.log(`   Permissions: ${createResp.data.permissions.join(", ")}`);
    console.log("\n⚠️  IMPORTANT: Save this API key securely! It won't be shown again.\n");

    // STEP 3: List all API keys
    console.log("📋 Listing all API keys...");
    const listResp = await adminClient.listAPIKeys();

    if (listResp.success && listResp.data) {
      console.log(`✅ Found ${listResp.data.total} API key(s):\n`);
      listResp.data.api_keys.forEach((key, index) => {
        console.log(`${index + 1}. ${key.name}`);
        console.log(`   ID: ${key.id}`);
        console.log(`   Prefix: ${key.key_prefix}...`);
        console.log(`   Status: ${key.is_active ? "🟢 Active" : "🔴 Inactive"}`);
        console.log(`   Last used: ${key.last_used_at || "Never"}`);
        console.log(`   Created: ${new Date(key.created_at).toLocaleString()}`);
        console.log();
      });
    }

    // STEP 4: Use the API key to authenticate
    console.log("🔐 Testing API key authentication...");
    const apiKeyClient = new NonefinityClient({
      apiUrl: "http://localhost:8000",
      apiKey: apiKey,
      debug: false,
    });

    // Try to list chat configs with the API key
    const configsResp = await apiKeyClient.listConfigs();
    if (configsResp.success) {
      console.log("✅ API key authentication works!");
      console.log(`   Found ${configsResp.data?.total || 0} chat configurations`);
    }

    // STEP 5: Get API key details
    console.log("\n📄 Getting API key details...");
    const getResp = await adminClient.getAPIKey(keyId);
    
    if (getResp.success && getResp.data) {
      console.log("✅ API key details:");
      console.log(`   Name: ${getResp.data.name}`);
      console.log(`   Active: ${getResp.data.is_active ? "Yes" : "No"}`);
      console.log(`   Permissions: ${getResp.data.permissions.join(", ")}`);
      console.log(`   Last used: ${getResp.data.last_used_at || "Never"}`);
    }

    // STEP 6: Update API key
    console.log("\n✏️  Updating API key name...");
    const updateResp = await adminClient.updateAPIKey(keyId, {
      name: "Production Website (Updated)",
    });

    if (updateResp.success && updateResp.data) {
      console.log("✅ API key updated successfully!");
      console.log(`   New name: ${updateResp.data.name}`);
    }

    // STEP 7: Revoke API key
    console.log("\n🚫 Revoking API key...");
    const revokeResp = await adminClient.revokeAPIKey(keyId);

    if (revokeResp.success && revokeResp.data) {
      console.log("✅ API key revoked successfully!");
      console.log(`   Status: ${revokeResp.data.is_active ? "Active" : "Inactive"}`);
    }

    // Try to use the revoked key (should fail)
    console.log("\n🔒 Testing revoked key...");
    const revokedTest = await apiKeyClient.listConfigs();
    if (!revokedTest.success) {
      console.log("✅ Revoked key correctly rejected!");
      console.log(`   Error: ${revokedTest.error}`);
    }

    // STEP 8: Delete API key
    console.log("\n🗑️  Deleting API key...");
    const deleteResp = await adminClient.deleteAPIKey(keyId);

    if (deleteResp.success) {
      console.log("✅ API key deleted successfully!");
    }

    // Final list
    console.log("\n📋 Final API key list...");
    const finalListResp = await adminClient.listAPIKeys();
    if (finalListResp.success && finalListResp.data) {
      console.log(`✅ Total API keys: ${finalListResp.data.total}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
  }

  console.log("\n✨ API Key Management Demo Complete!");
}

// Run the example
main();
