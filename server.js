import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Serveur Gemini opérationnel ✅");
});

app.post("/analyseIA", async (req, res) => {
  const texte = (req.body.texte || "").trim();

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        analyse: "",
        relance: "Clé Gemini manquante"
      });
    }

    if (!texte) {
      return res.json({
        analyse: "",
        relance: "Aucun texte reçu."
      });
    }

    const prompt = `
Voici un retour consommateur :
"${texte}"

Thèmes à analyser :
- Packaging
- Apparence
- Odeur/Arome
- Goût
- Morceaux
- Texture
- Arrière-goût
- Qualité santé

Consignes :
1. Pour chaque thème, indique l'un des 3 statuts exacts :
   - "Oui - Détaillé"
   - "Oui - Pas détaillé"
   - "Non"

2. Si un ou plusieurs thèmes sont "Oui - Pas détaillé",
   génère UNE relance polie sur 2 items maximum.

3. Si aucun thème n'est "Oui - Pas détaillé",
   mets exactement :
   "Réponse suffisamment détaillée ✅"

4. Retourne STRICTEMENT un JSON valide, sans markdown, sans commentaire, sans texte autour,
   avec cette structure exacte :

{
  "analyse": {
    "Packaging": "",
    "Apparence": "",
    "Odeur/Arome": "",
    "Goût": "",
    "Morceaux": "",
    "Texture": "",
    "Arrière-goût": "",
    "Qualité santé": ""
  },
  "relance": ""
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const output = (response.text || "").trim();

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(output);
    } catch (e) {
      jsonOutput = {
        analyse: output,
        relance: "Impossible de parser le JSON retourné par Gemini."
      };
    }

    res.json(jsonOutput);

  } catch (err) {
    console.error("Erreur Gemini :", err);

    res.json({
      analyse: "",
      relance: `Erreur Gemini : ${err.message || "Erreur inconnue"}`
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur prêt sur le port ${PORT} ✅`);
});