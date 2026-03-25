import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors()); // Permet les requêtes depuis ton HTML / LimeSurvey
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Route test rapide
app.get("/", (req, res) => {
    res.send("Serveur opérationnel ✅");
});

// Route principale pour analyse IA et génération relance
app.post("/analyseIA", async (req, res) => {
    const texte = req.body.texte || "";

    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.json({
                analyse: "",
                relance: "Clé OpenAI manquante"
            });
        }

        const prompt = `
Voici un retour consommateur :
"${texte}"

Pour chaque mot-clé :
Packaging, Apparence, Odeur/Arome, Goût, Morceaux, Texture, Arrière-goût, Qualité santé

1️⃣ Indique pour chaque mot-clé : Oui/Non - Détaillé/Pas détaillé

2️⃣ Si certains sont "Oui - Pas détaillé", génère directement une relance
limité à 2 items maximum, sous forme de question polie :
"Qu'avez-vous particulièrement apprécié par rapport au [item1] et au [item2] ?"

3️⃣ Retourne strictement en JSON :
{
  "analyse": "<résultat de l'analyse mot-clé>",
  "relance": "<question de relance ou 'Réponse suffisamment détaillée ✅'>"
}
`;

        // Appel à GPT-3.5-turbo
        let output = "";
        try {
            const completion = await client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            });
            output = completion?.choices?.[0]?.message?.content || "";
        } catch (err) {
            console.error("Erreur OpenAI capturée :", err);
            output = JSON.stringify({
                analyse: "",
                relance: `Erreur OpenAI : ${err.message}`
            });
        }

        // Parser le JSON renvoyé par l'IA
        let jsonOutput;
        try {
            jsonOutput = JSON.parse(output);
        } catch {
            jsonOutput = {
                analyse: output,
                relance: "Impossible de générer une relance structurée."
            };
        }

        res.json(jsonOutput);

    } catch (err) {
        console.error("Erreur serveur globale :", err);
        res.json({
            analyse: "",
            relance: `Erreur serveur : ${err.message}`
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT} ✅`));