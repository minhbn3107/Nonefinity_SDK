/**
 * React Example
 * Shows how to use the ChatWidget component in a React application
 */

import React from "react";
import { ChatWidget } from "../src/index";
import "../src/components/ChatWidget.css";

// Example 1: Basic Widget
export function BasicChatWidget() {
    return (
        <ChatWidget
            sessionId="your-session-id"
            // apiUrl="http://localhost:8000" // Optional: Defaults to production
            apiKey="your-api-key"
            position="bottom-right"
            title="Support Assistant"
        />
    );
}

// Example 2: Custom Styled Widget
export function CustomStyledWidget() {
    return (
        <ChatWidget
            sessionId="your-session-id"
            // apiUrl="http://localhost:8000" // Optional: Defaults to production
            apiKey="your-api-key"
            position="bottom-left"
            primaryColor="#10b981" // Green color
            title="🤖 AI Helper"
            placeholder="How can I help you today?"
            className="my-custom-widget"
            style={{ zIndex: 9999 }}
        />
    );
}

// Example 3: Widget with Authentication
export function AuthenticatedWidget() {
    const getToken = async () => {
        // Get token from your auth system
        // This could be from localStorage, a state management library, etc.
        const token = localStorage.getItem("auth_token");
        return token;
    };

    return (
        <ChatWidget
            sessionId="your-session-id"
            // apiUrl="http://localhost:8000" // Optional: Defaults to production
            getAuthToken={getToken}
            position="bottom-right"
            title="AI Assistant"
        />
    );
}

// Example 4: Widget with Error Handling
export function WidgetWithErrorHandling() {
    const handleError = (error: Error) => {
        console.error("Chat widget error:", error);

        // Send to error tracking service
        // trackError(error);

        // Show user notification
        alert(`Chat error: ${error.message}`);
    };

    return (
        <ChatWidget
            sessionId="your-session-id"
            // apiUrl="http://localhost:8000" // Optional: Defaults to production
            apiKey="your-api-key"
            position="bottom-right"
            title="AI Assistant"
            onError={handleError}
        />
    );
}

// Example 5: Full Application
export function App() {
    return (
        <div className="app">
            <header>
                <h1>My Application</h1>
            </header>

            <main>
                <p>Your application content here...</p>
            </main>

            {/* Chat widget - automatically positioned */}
            <ChatWidget
                sessionId="default-session-id"
                // apiUrl="http://localhost:8000" // Optional: Defaults to production
                apiKey="your-api-key"
                position="bottom-right"
                primaryColor="#3b82f6"
                title="AI Support"
                placeholder="Ask me anything..."
            />
        </div>
    );
}
