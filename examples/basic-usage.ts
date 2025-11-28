/**
 * Basic Usage Example
 * Shows how to use the Nonefinity SDK with Node.js
 */

import { NonefinityClient } from "../src/index";

async function main() {
    // Initialize the client
    const client = new NonefinityClient({
        // apiUrl: "http://localhost:8000", // Optional: Defaults to production
        apiKey: "your-api-key-here",
        debug: true,
    });

    try {
        // List available chat configurations
        console.log("📋 Fetching chat configurations...");
        const configs = await client.listConfigs();

        if (!configs.success || !configs.data) {
            console.error("❌ Failed to fetch configs:", configs.error);
            return;
        }

        console.log(`✅ Found ${configs.data.total} configurations`);

        // Get the first config (or create one if none exist)
        let configId: string;

        if (configs.data.chat_configs.length > 0) {
            configId = configs.data.chat_configs[0].id;
            console.log(`📌 Using existing config: ${configId}`);
        } else {
            console.log("📝 Creating new chat configuration...");
            const newConfig = await client.createConfig({
                name: "SDK Test Bot",
                chat_model_id: "your-model-id",
                instruction_prompt: "You are a helpful AI assistant.",
            });

            if (!newConfig.success || !newConfig.data) {
                console.error("❌ Failed to create config:", newConfig.error);
                return;
            }

            configId = newConfig.data.id;
            console.log(`✅ Created new config: ${configId}`);
        }

        // Create a chat session
        console.log("💬 Creating chat session...");
        const session = await client.createSession({
            chat_config_id: configId,
            name: `Test Session ${Date.now()}`,
        });

        if (!session.success || !session.data) {
            console.error("❌ Failed to create session:", session.error);
            return;
        }

        console.log(`✅ Created session: ${session.data.id}`);

        // Stream a message
        console.log("🚀 Streaming message...\n");

        await client.streamMessage(
            session.data.id,
            "Hello! Can you help me understand what you can do?",
            (event) => {
                switch (event.event) {
                    case "start":
                        console.log("🎬 Stream started");
                        break;

                    case "tool_calls":
                        console.log(`🔧 Tool called: ${event.data.name}`);
                        console.log(
                            "   Arguments:",
                            JSON.stringify(event.data.arguments, null, 2)
                        );
                        break;

                    case "tool_result":
                        console.log(`✅ Tool result from ${event.data.name}:`);
                        console.log("   Result:", event.data.result);
                        break;

                    case "ai_result":
                        // Print content as it streams
                        process.stdout.write(event.data.content);
                        break;

                    case "error":
                        console.error("\n❌ Stream error:", event.data.message);
                        break;

                    case "message":
                        if (event.data.done) {
                            console.log("\n\n✨ Stream completed");
                        }
                        break;
                }
            }
        );

        // Get session with messages
        console.log("\n📨 Fetching session messages...");
        const sessionData = await client.getSession(session.data.id);

        if (sessionData.success && sessionData.data) {
            console.log(
                `✅ Session has ${
                    sessionData.data.messages?.total || 0
                } messages`
            );
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run the example
main();
