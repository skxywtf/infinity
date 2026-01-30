import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

// CONFIG: Path to the Python executable in the OpenBB .venv
// We use absolute path to be safe, assuming the standard location relative to the project
// User's OpenBB path: d:\Projects\SKXYWTF\OpenBB
const PYTHON_PATH = "d:\\Projects\\SKXYWTF\\OpenBB\\.venv\\Scripts\\python.exe";
const BRIDGE_SCRIPT_PATH = path.join(process.cwd(), "lib", "openbb_bridge.py");

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ticker, type } = body;

        if (!ticker || !type) {
            return NextResponse.json(
                { error: "Ticker and type are required" },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ["price", "news", "profile"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid type provided" },
                { status: 400 }
            );
        }

        // Construct command
        // "python path" "script path" --ticker TICKER --type TYPE
        const command = `"${PYTHON_PATH}" "${BRIDGE_SCRIPT_PATH}" --ticker "${ticker}" --type "${type}"`;

        console.log("Executing OpenBB command:", command);

        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.warn("OpenBB Bridge Stderr:", stderr);
            // Determine if it is a fatal error or just warnings
            // Many python libs print to stderr for warnings, so we don't fail immediately unless stdout is empty
        }

        try {
            // Parse the JSON output from the script
            const data = JSON.parse(stdout);

            if (data.error) {
                console.error("OpenBB Script returned error:", data.error);
                return NextResponse.json({ error: data.error }, { status: 500 });
            }

            return NextResponse.json(data);
        } catch (parseError) {
            console.error("Failed to parse OpenBB output:", stdout);
            return NextResponse.json(
                { error: "Failed to parse data from OpenBB", raw: stdout },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("OpenBB API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
