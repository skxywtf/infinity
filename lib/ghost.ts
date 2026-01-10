
import jwt from 'jsonwebtoken';
import axios from 'axios';

const GHOST_URL = process.env.GHOST_API_URL || 'https://worldtradefactory.ghost.io'; // Default or Env
const ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY!;

/**
 * Generates a short-lived JWT for Ghost Admin API authentication.
 */
function getGhostToken() {
    if (!ADMIN_KEY) return null;
    const [id, secret] = ADMIN_KEY.split(':');

    // JWT header/payload structure required by Ghost
    return jwt.sign({}, Buffer.from(secret, 'hex'), {
        keyid: id,
        algorithm: 'HS256',
        expiresIn: '5m',
        audience: '/admin/'
    });
}

/**
 * Ensures a member exists in Ghost with the given email.
 * If not, creates them.
 * Returns the member object.
 */
export async function syncGhostMember(email: string, name?: string) {
    if (!ADMIN_KEY) {
        console.warn("Ghost Admin Key missing. Skipping Ghost sync.");
        return null;
    }

    const token = getGhostToken();
    const headers = { Authorization: `Ghost ${token}` };

    try {
        // 1. Try to find member
        const searchRes = await axios.get(`${GHOST_URL}/ghost/api/admin/members/?filter=email:'${email}'`, { headers });
        if (searchRes.data.members && searchRes.data.members.length > 0) {
            return searchRes.data.members[0];
        }

        // 2. Create member if not found
        const createRes = await axios.post(`${GHOST_URL}/ghost/api/admin/members/`, {
            members: [{ email, name: name || "Infinity User" }]
        }, { headers });

        return createRes.data.members[0];

    } catch (error) {
        console.error("Ghost Sync Error:", error);
        return null;
    }
}
