// api/timer.js
const { Octokit } = require("@octokit/rest");

// --- CONFIGURARE ---
// Schimbă aceste valori cu datele tale!
const REPO_OWNER = 'sorincismas'; // Ex: 'ionpopescu'
const REPO_NAME = 'beer-time';      // Ex: 'beer-time'
const FILE_PATH = 'time.txt';             // Fișierul folosit ca bază de date

// Token-ul va fi citit în mod sigur din variabilele de mediu de pe Vercel
const GITHUB_TOKEN = process.env.GITHUB_PAT;
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Funcția principală care gestionează cererile GET și POST
export default async function handler(req, res) {
    // Setăm headerele pentru a permite cereri de oriunde (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

    try {
        // Încercăm să citim fișierul de pe GitHub
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        }).catch(e => ({ data: null })); // Dacă fișierul nu există, nu crăpăm

        // Dacă cererea este POST (butonul a fost apăsat)
        if (req.method === 'POST') {
            const newTimestamp = String(new Date().getTime());
            
            await octokit.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: FILE_PATH,
                message: `[BOT] Start beer ban at ${newTimestamp}`,
                content: Buffer.from(newTimestamp).toString('base64'),
                sha: fileData ? fileData.sha : undefined, // Trimitem 'sha' dacă fișierul există, pentru update
            });

            return res.status(200).json({ startTime: parseInt(newTimestamp, 10) });
        }

        // Dacă cererea este GET (pagina se încarcă)
        if (!fileData) {
            return res.status(200).json({ startTime: null }); // Nu există timer activ
        }

        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        return res.status(200).json({ startTime: parseInt(content, 10) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'A apărut o eroare pe server.' });
    }
}
