import { askQuestion, askPermission, askChoice } from '../utils/hitl';

async function exampleQuestion() {
    console.log("Example 1: Asking a question...");

    const sessionData = {
        source_app: "hitl_example",
        session_id: "example_session_123"
    };

    const question = "What coding style should I use for this project: functional or object-oriented?";
    console.log(`Sending question: ${question}`);

    const answer = await askQuestion(question, sessionData, 60);

    if (answer) {
        console.log(`✅ Received answer: ${answer}`);
        return answer;
    } else {
        console.log("❌ No response received (timeout or error)");
        return null;
    }
}

async function examplePermission() {
    console.log("\nExample 2: Requesting permission...");

    const sessionData = {
        source_app: "hitl_example",
        session_id: "example_session_456"
    };

    const question = "⚠️  Agent wants to execute: rm -rf /tmp/test_data\n\nThis will delete temporary test data. Do you want to allow this?";
    console.log(`Requesting permission: ${question}`);

    const approved = await askPermission(question, sessionData, 60);

    if (approved) {
        console.log("✅ Permission granted!");
        return true;
    } else {
        console.log("❌ Permission denied!");
        return false;
    }
}

async function exampleChoice() {
    console.log("\nExample 3: Requesting a choice...");

    const sessionData = {
        source_app: "hitl_example",
        session_id: "example_session_789"
    };

    const question = "Which testing framework should I use for this project?";
    const choices = ["Jest", "Vitest", "Mocha", "Jasmine"];
    console.log(`Presenting choices: ${choices}`);

    const selected = await askChoice(question, choices, sessionData, 60);

    if (selected) {
        console.log(`✅ User selected: ${selected}`);
        return selected;
    } else {
        console.log("❌ No choice made (timeout or error)");
        return null;
    }
}

async function main() {
    console.log("=".repeat(60));
    console.log("Human-in-the-Loop (HITL) Examples");
    console.log("=".repeat(60));
    console.log("\nMake sure:");
    console.log("1. Observability server is running (apps/server)");
    console.log("2. Client dashboard is open (apps/client)");
    console.log("3. You're ready to respond to requests in the dashboard");
    console.log("\n" + "=".repeat(60) + "\n");

    await exampleQuestion();
    await examplePermission();
    await exampleChoice();

    console.log("\n" + "=".repeat(60));
    console.log("Examples completed!");
    console.log("=".repeat(60));
}

if (require.main === module) {
    main();
}
