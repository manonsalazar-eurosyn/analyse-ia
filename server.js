import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // permet à LimeSurvey d'appeler ton serveur
app.use(express.json());

app.post("/analyseIA", async (req, res) => {
    try {
        const texte = req.body.texte;

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

        // Clé factice pour tester
        const OPENAI_API_KEY = "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";

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            })
        });

        const data = await response.json();

        const reponseIA = data.choices[0].message.content;

        res.json({ reponseIA }); // le front devra lire data.reponseIA

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});