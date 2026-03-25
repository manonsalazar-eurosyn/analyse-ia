import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Vérifier la clé OpenAI
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY n'est pas définie. La route /analyseIA renverra un message d'erreur.");
}

// Initialisation OpenAI avec variable Render
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Route test pour vérifier que le serveur répond
app.get("/", (req, res) => {
    res.send("Serveur opérationnel ✅");
});

// Route principale
app.post("/analyseIA", async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: "Clé OpenAI manquante" });
        }

        const texte = req.body.texte || "";

        const prompt = `
Analyse ce texte.

Pour chaque mot-clé suivant :
Packaging, Apparence, Odeur/Arome, Goût, Morceaux, Texture, Arrière-goût, Qualité santé

Dis :
- s'il est mentionné
- s'il est détaillé ou juste cité

Format de réponse :
Mot-clé : Oui/Non - Détaillé/Pas détaillé

Texte :
${texte}
        `;

        // Appel API OpenAI via nouveau SDK
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0
        });

        const output = completion.choices?.[0]?.message?.content || "Erreur : pas de réponse IA";

        console.log("✅ Analyse réalisée");  // log pour Render
        res.json({ reponseIA: output });

    } catch (error) {
        console.error("Erreur API OpenAI :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Lancer serveur avec logs clairs
const PORT = process.env.PORT || 3000;
console.log("Début du serveur…");  // log avant app.listen
app.listen(PORT, () => {
    console.log(`Serveur prêt sur le port ${PORT} ✅`);
});