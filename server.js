import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors()); // Permet les requêtes cross-origin
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Route test simple
app.get("/", (req, res) => {
    res.send("Serveur opérationnel ✅");
});

// Route principale pour l'analyse IA et génération de relance
app.post("/analyseIA", async (req, res) => {
    const texte = req.body.texte || "";

    try {
        // Prompt pour l'IA : analyser et générer la relance
        const prompt = `
Voici un retour consommateur :
"${texte}"

Pour chaque mot-clé suivant :
Packaging, Apparence, Odeur/Arome, Goût, Morceaux, Texture, Arrière-goût, Qualité santé

1. Indique pour chaque mot-clé :
Mot-clé : Oui/Non - Détaillé/Pas détaillé

2. Si certains items sont "Oui - Pas détaillé", génère directement une relance
limitée à 2 items maximum, sous forme de question polie :
"Qu'avez-vous particulièrement apprécié par rapport au [item1] et au [item2] ?"
Ne répète pas les items déjà détaillés.

3. Retourne strictement en JSON :
{
  "analyse": "<résultat de l'analyse mot-clé>",
  "relance": "<question de relance ou 'Réponse suffisamment détaillée ✅'>"
}
`;

        const completion = await client.chat.completions.create({
            model: "gpt-3.5-turbo", // ou gpt-4o-mini si ton compte le permet
            messages: [{ role: "user", content: prompt }],
            temperature: 0
        });

        const output = completion?.choices?.[0]?.message?.content || "";

        // Essayer de parser le JSON renvoyé par l'IA
        let jsonOutput;
        try {
            jsonOutput = JSON.parse(output);
        } catch {
            jsonOutput = {
                analyse: output,
                relance: "Impossible de générer la relance automatiquement."
            };
        }

        res.json(jsonOutput);

    } catch (err) {
        console.error("Erreur OpenAI :", err);
        res.status(500).json({ analyse: "", relance: `Erreur OpenAI : ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT} ✅`));