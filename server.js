import express from "express";
import cors from "cors";
import { Mistral } from "@mistralai/mistralai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

app.get("/", (req, res) => {
  res.send("Serveur Mistral opérationnel ✅");
});

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

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
Tu es un interviewer senior expert en tests consommateurs, spécialisé dans les produits alimentaires pour chats et chiens.

Ta mission :
1. lire la réponse ouverte d’un consommateur
2. repérer si certains thèmes sont mentionnés
3. décider pour chaque thème s’il est :
   - "Oui - Détaillé"
   - "Oui - Pas détaillé"
   - "Non"
4. si un ou plusieurs thèmes sont "Oui - Pas détaillé", générer UNE seule relance courte, concrète, neutre, sur 1 thème principal ou 2 thèmes maximum
5. si tout est déjà suffisamment précis, écrire exactement :
   "Réponse suffisamment détaillée ✅"

Réponse consommateur :
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

Définition des statuts :

1) "Oui - Détaillé"
Utiliser ce statut si le thème est mentionné avec au moins un élément concret, observable ou actionnable.
Exemples :
- "odeur trop forte"
- "texture trop sèche"
- "morceaux trop gros"
- "pack difficile à ouvrir"
- "arrière-goût désagréable"
- "ça sent artificiel"
- "le produit colle à la cuillère"
- "mon chat a mangé tout de suite"
- "il a léché la gamelle"
- "selles plus normales"

2) "Oui - Pas détaillé"
Utiliser ce statut si le thème est mentionné mais reste vague, général ou peu exploitable.
Exemples :
- "bonne odeur"
- "bonne texture"
- "apparence bien"
- "goût correct"
- "packaging bien"
- "bonne qualité"
- "ça semble sain"

3) "Non"
Utiliser ce statut si le thème n’est pas mentionné.

Règles importantes :
- Une réponse est suffisante si elle contient un thème clair + un détail concret, observable ou actionnable.
- Une réponse courte peut être suffisante si elle est déjà très claire.
- Une réponse plus longue peut rester insuffisante si elle reste vague.
- Ne pas inventer d’information absente.
- Ne pas surinterpréter.

Règles de relance :
- Générer UNE seule relance
- Une seule phrase
- Courte
- Concrète
- Neutre
- Sans remerciement
- Sans résumé
- Sans jargon
- Sans "pouvez-vous m’en dire plus"
- Maximum 18 mots idéalement
- Relancer sur 1 thème principal si possible
- Relancer sur 2 thèmes maximum seulement si les 2 sont clairement mentionnés et restent vagues

Priorité des thèmes à creuser :
1. Packaging
2. Apparence
3. Odeur/Arome
4. Goût
5. Morceaux
6. Texture
7. Arrière-goût
8. Qualité santé

Exemples de bonnes relances :
- "Qu’est-ce qui vous plaît précisément dans l’odeur ?"
- "Qu’est-ce qui vous gêne dans la texture ?"
- "Qu’est-ce qui vous plaît dans l’apparence ?"
- "Qu’est-ce qui vous gêne dans les morceaux ?"
- "Qu’est-ce qui vous fait percevoir une bonne qualité santé ?"

Si tous les thèmes mentionnés sont déjà détaillés, mets exactement :
"Réponse suffisamment détaillée ✅"

Retourne STRICTEMENT un JSON valide, sans markdown, sans commentaire, sans texte autour, avec cette structure exacte :

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
          content:
            "Tu es un moteur d’analyse. Tu réponds uniquement avec un JSON strictement valide. Aucun markdown. Aucun texte hors JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1
    });

    let output = response.choices?.[0]?.message?.content || "";

    if (Array.isArray(output)) {
      output = output.map(x => x.text || "").join("").trim();
    } else {
      output = String(output).trim();
    }

    const jsonOutput = extractJson(output);

    if (!jsonOutput) {
      return res.json({
        analyse: "",
        relance: "Impossible de parser le JSON retourné par Mistral."
      });
    }

    return res.json(jsonOutput);

  } catch (err) {
    console.error("Erreur Mistral :", err);

    return res.json({
      analyse: "",
      relance: `Erreur Mistral : ${err.message || "Erreur inconnue"}`
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur prêt sur le port ${PORT} ✅`);
});