import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Vérifier que la clé OpenAI est définie
if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ Attention : OPENAI_API_KEY n'est pas définie !");
} else {
    console.log("✅ OPENAI_API_KEY détectée");
}

// Initialisation OpenAI
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Route test simple
app.get("/", (req, res) => {
    res.send("Serveur opérationnel ✅");
});

// Route principale pour l'analyse IA
app.post("/analyseIA", async (req, res) => {
    try {
        const texte = req.body.texte || "";

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ reponseIA: "Clé OpenAI manquante" });
        }

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

        let output = "";

        try {
            const completion = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            });

            // ⚡ Sécurité : vérifier que choices[0] existe
            if (completion?.choices?.[0]?.message?.content) {
                output = completion.choices[0].message.content;
            } else {
                output = "Erreur : pas de réponse IA disponible";
            }

        } catch (err) {
            console.error("Erreur OpenAI :", err);
            output = `Erreur OpenAI : ${err.message}`;
        }

        res.json({ reponseIA: output });

    } catch (error) {
        console.error("Erreur serveur globale :", error);
        res.status(500).json({ reponseIA: "Erreur serveur" });
    }
});

// Lancer serveur
const PORT = process.env.PORT || 3000;
console.log("Début du serveur…");
app.listen(PORT, () => {
    console.log(`Serveur prêt sur le port ${PORT} ✅`);
});