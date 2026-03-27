import express from "express";
import cors from "cors";
import Mistral from "@mistralai/mistralai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

app.get("/", (req, res) => {
  res.send("Serveur Mistral opérationnel ✅");
});

app.post("/analyseIA", async (req, res) => {
  const texte = (req.body.texte || "").trim();

  try {
    if (!process.env.MISTRAL_API_KEY) {
      return res.json({
        analyse: "",
        relance: "Clé Mistral manquante"
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

    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant qui retourne uniquement du JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    const output = (response.choices?.[0]?.message?.content || "").trim();

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(output);
    } catch (e) {
      jsonOutput = {
        analyse: output,
        relance: "Impossible de parser le JSON retourné par Mistral."
      };
    }

    res.json(jsonOutput);

  } catch (err) {
    console.error("Erreur Mistral :", err);

    res.json({
      analyse: "",
      relance: `Erreur Mistral : ${err.message || "Erreur inconnue"}`
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur prêt sur le port ${PORT} ✅`);
});