import { askPermission } from './utils/hitl';

async function main() {
    console.log("🚀 Sending HITL permission request...");
    console.log("📊 Check your dashboard at http://localhost:5173");
    console.log("⏳ Waiting for your response...\n");

    const sessionData = {
        source_app: "hitl-test",
        session_id: "test-session-001"
    };

    const question = `⚠️ DANGER: Agent wants to execute a potentially dangerous command:

    $ rm -rf /tmp/old_backups

This will permanently delete all files in /tmp/old_backups.

Do you want to allow this operation?`;

    const approved = await askPermission(question, sessionData, 120);

    console.log("\n" + "=".repeat(60));
    if (approved) {
        console.log("✅ PERMISSION GRANTED!");
        console.log("The agent would now proceed with the operation.");
    } else {
        console.log("❌ PERMISSION DENIED!");
        console.log("The operation has been blocked.");
    }
    console.log("=".repeat(60));

    process.exit(approved ? 0 : 1);
}

if (require.main === module) {
    main();
}
