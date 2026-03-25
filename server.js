import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Initialisation OpenAI avec variable Render
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post("/analyseIA", async (req, res) => {
    try {
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

        res.json({ reponseIA: output });

    } catch (error) {
        console.error("Erreur API OpenAI :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Lancer serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});