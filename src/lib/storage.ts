import fs from "fs/promises";
import path from "path";

export async function saveFile(relativePath: string, data: Buffer) {
    const abs = path.join(process.cwd(), "public", relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    return abs;
}
